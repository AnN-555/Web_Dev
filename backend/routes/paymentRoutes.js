import express from "express";
import Order from "../models/order.js";
import Game from "../models/game.js";
import Cart from "../models/cart.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import { protect } from "../middleware/authMiddleware.js";
import { buildQueryString, hmacSHA512, sortObject, verifyVnpaySignature } from "../utils/vnpay.js";

const router = express.Router();

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
};

const getClientIp = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "127.0.0.1";
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

// POST /api/payments/vnpay/create
// Body: { gameId }
// Auth required. Creates a pending order and returns VNPay payment URL (sandbox/prod based on env).
router.post("/vnpay/create", protect, async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ message: "Missing gameId" });

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const existing = await Order.findOne({
      user: req.user._id,
      game: gameId,
      status: { $in: ["pending", "completed"] },
    });
    if (existing) return res.status(400).json({ message: "Bạn đã mua game này rồi" });

    const order = await Order.create({
      user: req.user._id,
      game: gameId,
      priceAtPurchase: game.price ?? 0,
      status: "pending",
      paymentProvider: "vnpay",
    });

    const tmnCode = required("VNP_TMNCODE");
    const hashSecret = required("VNP_HASHSECRET");
    const vnpUrl = required("VNP_URL");
    const returnUrl = required("VNP_RETURN_URL");
    const ipAddr = getClientIp(req);

    // VNPay expects amount in VND * 100
    const amount = Math.round((order.priceAtPurchase ?? 0) * 100);

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: process.env.VNP_LOCALE || "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: order._id.toString(),
      vnp_OrderInfo: `Pay for order ${order._id}`,
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

    const payUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

    order.paymentTxnRef = vnpParams.vnp_TxnRef;
    await order.save();

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentUrl: payUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// GET /api/payments/vnpay/return
// User redirect URL. Should NOT be used to confirm payment; only display result.
router.get("/vnpay/return", async (req, res) => {
  try {
    const hashSecret = required("VNP_HASHSECRET");
    const vnpParams = { ...req.query };

    const { ok } = verifyVnpaySignature({ vnpParams, hashSecret });
    if (!ok) return res.status(400).json({ success: false, message: "Invalid signature" });

    res.json({ success: true, data: vnpParams });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// GET /api/payments/vnpay/ipn
// VNPay server-to-server callback. This is the source of truth for marking orders paid.
router.get("/vnpay/ipn", async (req, res) => {
  try {
    const hashSecret = required("VNP_HASHSECRET");
    const vnpParams = { ...req.query };

    const { ok } = verifyVnpaySignature({ vnpParams, hashSecret });
    if (!ok) return res.json({ RspCode: "97", Message: "Invalid signature" });

    const txnRef = vnpParams.vnp_TxnRef;
    const rspCode = vnpParams.vnp_ResponseCode;
    const amount = Number(vnpParams.vnp_Amount || 0);
    const transactionNo = vnpParams.vnp_TransactionNo;

    // Ưu tiên xử lý theo Payment (cart checkout). Fallback sang Order (single item) để tương thích.
    const payment = await Payment.findById(txnRef);
    if (payment) {
      const expectedAmount = Math.round((payment.totalAmount ?? 0) * 100);
      if (amount !== expectedAmount) return res.json({ RspCode: "04", Message: "Invalid amount" });

      if (payment.status === "completed") {
        return res.json({ RspCode: "02", Message: "Payment already confirmed" });
      }

      if (rspCode === "00") {
        payment.status = "completed";
        payment.providerTxnRef = txnRef;
        payment.providerTransactionNo = transactionNo;
        payment.paidAt = new Date();
        await payment.save();

        // Cấp quyền game + tạo Order completed + clear cart (idempotent)
        const userId = payment.user;
        const gameIds = payment.items.map((i) => i.game);

        // addToSet ownedGames
        await User.updateOne(
          { _id: userId },
          { $addToSet: { ownedGames: { $each: gameIds } } }
        );

        // tạo orders cho từng game nếu chưa có
        for (const it of payment.items) {
          const exists = await Order.findOne({
            user: userId,
            game: it.game,
            status: { $in: ["pending", "completed"] },
          });
          if (exists) continue;
          await Order.create({
            user: userId,
            game: it.game,
            priceAtPurchase: it.priceAtPurchase ?? 0,
            status: "completed",
            paymentProvider: "vnpay",
            paymentTxnRef: txnRef,
            paymentTransactionNo: transactionNo,
            paidAt: new Date(),
          });
        }

        // Clear cart nếu có
        await Cart.updateOne({ user: userId }, { $set: { items: [] } });

        return res.json({ RspCode: "00", Message: "Confirm Success" });
      }

      payment.status = "cancelled";
      await payment.save();
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    const order = await Order.findById(txnRef);
    if (!order) return res.json({ RspCode: "01", Message: "Order not found" });

    const expectedAmount = Math.round((order.priceAtPurchase ?? 0) * 100);
    if (amount !== expectedAmount) return res.json({ RspCode: "04", Message: "Invalid amount" });

    if (order.status === "completed") return res.json({ RspCode: "02", Message: "Order already confirmed" });

    if (rspCode === "00") {
      order.status = "completed";
      order.paymentProvider = "vnpay";
      order.paymentTxnRef = txnRef;
      order.paymentTransactionNo = transactionNo;
      order.paidAt = new Date();
      await order.save();
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    order.status = "cancelled";
    await order.save();
    return res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (err) {
    return res.json({ RspCode: "99", Message: err.message || "Unknown error" });
  }
});

export default router;

