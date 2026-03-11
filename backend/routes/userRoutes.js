// Thêm vào backend/routes/authRoutes.js (hoặc tạo userRoutes.js)
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router(); // nếu dùng file riêng

// GET /api/users/profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/profile — cập nhật thông tin
router.put("/profile", protect, async (req, res) => {
  try {
    const { username, bio, country, avatar } = req.body;

    // Kiểm tra username trùng
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ message: "Username đã tồn tại" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio, country, avatar },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/password — đổi mật khẩu
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    user.password = newPassword;
    await user.save(); // pre-save hook sẽ tự hash

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});