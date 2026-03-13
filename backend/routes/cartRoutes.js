import express from "express";
import Cart from "../models/cart.js";
import Order from "../models/order.js";
import Game from "../models/game.js";
import Payment from "../models/payment.js";
import { protect } from "../middleware/authMiddleware.js";
import { buildQueryString, hmacSHA512, sortObject } from "../utils/vnpay.js";

const router = express.Router();

// Health check (no auth) - verify cart routes are loaded
router.get("/ping", (req, res) => res.json({ ok: true, message: "Cart API is ready" }));

router.use(protect);

// GET /api/cart - Get current user's cart
router.get("/", async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.game",
      "name slug price headerImage"
    );
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
      await cart.populate("items.game", "name slug price headerImage");
    }
    // Disable caching so client always receives fresh cart data
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cart/add - Add game to cart
router.post("/add", async (req, res) => {
  try {
    const { gameId } = req.body;
    const userId = req.user._id;

    if (!gameId) {
      return res.status(400).json({ success: false, message: "Missing gameId" });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const exists = cart.items.some((i) => i.game.toString() === gameId);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Game already in cart",
      });
    }

    cart.items.push({ game: gameId });
    await cart.save();
    await cart.populate("items.game", "name slug price headerImage");

    res.json({ success: true, data: cart, message: "Added to cart" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart/item/:gameId - Remove game from cart
router.delete("/item/:gameId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    cart.items = cart.items.filter(
      (i) => i.game.toString() !== req.params.gameId
    );
    await cart.save();
    await cart.populate("items.game", "name slug price headerImage");
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cart/checkout - Create orders from cart and clear cart
router.post("/checkout", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.game"
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Snapshot các game chưa mua để đem đi thanh toán
    const items = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const game = item.game;
      if (!game) continue;

      const existingOrder = await Order.findOne({
        user: req.user._id,
        game: game._id,
        status: { $in: ["pending", "completed"] },
      });
      if (existingOrder) continue;

      const price = game.price ?? 0;
      items.push({ game: game._id, priceAtPurchase: price });
      totalAmount += price;
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No payable items in cart",
      });
    }

    const payment = await Payment.create({
      user: req.user._id,
      provider: "vnpay",
      status: "pending",
      items,
      totalAmount,
      providerTxnRef: "", // set below
    });

    const required = (name) => {
      const v = process.env[name];
      if (!v) throw new Error(`${name} is not configured`);
      return v;
    };

    const getClientIp = (req2) => {
      const xf = req2.headers["x-forwarded-for"];
      if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
      return req2.socket?.remoteAddress || "127.0.0.1";
    };

    const formatVnpDate = (d = new Date()) => {
      const pad = (n) => String(n).padStart(2, "0");
      return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
      );
    };

    const tmnCode = required("VNP_TMNCODE");
    const hashSecret = required("VNP_HASHSECRET");
    const vnpUrl = required("VNP_URL");
    const returnUrl = required("VNP_RETURN_URL");

    // VNPay expects amount in VND * 100
    const amount = Math.round(totalAmount * 100);
    const ipAddr = getClientIp(req);

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: process.env.VNP_LOCALE || "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: payment._id.toString(),
      vnp_OrderInfo: `Pay for payment ${payment._id}`,
      vnp_OrderType: process.env.VNP_ORDER_TYPE || "other",
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVnpDate(),
    };

    if (process.env.VNP_BANKCODE) vnpParams.vnp_BankCode = process.env.VNP_BANKCODE;

    const sorted = sortObject(vnpParams);
    const signData = buildQueryString(sorted);
    const secureHash = hmacSHA512(hashSecret, signData);

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    payment.providerTxnRef = vnpParams.vnp_TxnRef;
    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl,
        totalAmount,
        itemsCount: items.length,
      },
      message: "Redirect to VNPay to complete payment",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
