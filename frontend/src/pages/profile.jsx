// frontend/src/pages/profile.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Header from "../components/header";
import "./profile.css";

/* ─────────────────────────────────────────
   MODAL EDIT PROFILE
───────────────────────────────────────── */
function EditProfileModal({ user, onClose, onSaved }) {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({
    username: user?.username || "",
    country:  user?.country  || "Vietnam",
    bio:      user?.bio      || "",
  });
  const [pw, setPw] = useState({
    oldPassword: "", newPassword: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type: "", text: "" });

  const setSuccess = (t) => setMsg({ type: "success", text: t });
  const setError   = (t) => setMsg({ type: "error",   text: t });
  const clearMsg   = ()  => setMsg({ type: "", text: "" });

  /* ── Cập nhật thông tin ── */
  const handleInfoSave = async () => {
    clearMsg(); setLoading(true);
    try {
      const res = await api.put("/users/profile", form);
      setSuccess("Cập nhật thành công!");
      onSaved(res.data.user);
    } catch (e) {
      setError(e.response?.data?.message || "Có lỗi xảy ra");
    } finally { setLoading(false); }
  };

  /* ── Đổi mật khẩu ── */
  const handlePwSave = async () => {
    clearMsg();
    if (pw.newPassword !== pw.confirmPassword)
      return setError("Mật khẩu mới không khớp");
    if (pw.newPassword.length < 6)
      return setError("Mật khẩu mới tối thiểu 6 ký tự");
    setLoading(true);
    try {
      await api.put("/users/change-password", {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      });
      setSuccess("Đổi mật khẩu thành công!");
      setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(e.response?.data?.message || "Mật khẩu hiện tại không đúng");
    } finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); clearMsg(); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>✏️ Chỉnh sửa Profile</h2>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === "info" ? "active" : ""}`}
            onClick={() => switchTab("info")}>Thông tin</button>
          <button className={`modal-tab ${tab === "password" ? "active" : ""}`}
            onClick={() => switchTab("password")}>Đổi mật khẩu</button>
        </div>

        {tab === "info" && (
          <>
            <div className="form-group">
              <label>Username</label>
              <input value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Quốc gia</label>
              <input value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Mô tả ngắn về bạn..." />
            </div>
          </>
        )}

        {tab === "password" && (
          <>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" value={pw.oldPassword}
                onChange={e => setPw({ ...pw, oldPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" value={pw.newPassword}
                onChange={e => setPw({ ...pw, newPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" value={pw.confirmPassword}
                onChange={e => setPw({ ...pw, confirmPassword: e.target.value })} />
            </div>
          </>
        )}

        <div className="modal-footer">
          <span className={msg.type === "success" ? "msg-success" : "msg-error"}>
            {msg.text}
          </span>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Huỷ</button>
            <button className="btn-save" disabled={loading}
              onClick={tab === "info" ? handleInfoSave : handlePwSave}>
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TRANG PROFILE
───────────────────────────────────────── */
export default function ProfilePage() {
  const { user: authUser, setUser } = useAuth();
  const navigate  = useNavigate();
  const avatarRef = useRef(null);

  const [profile,    setProfile]    = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copied,     setCopied]     = useState(false);

  /* ── Fetch data ── */
  useEffect(() => {
    if (!authUser) { navigate("/login"); return; }
    (async () => {
      try {
        const [pRes, oRes] = await Promise.all([
          api.get("/users/profile"),
          api.get("/orders"),
        ]);
        setProfile(pRes.data);
        setOrders(oRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    })();
  }, [authUser]);

  /* ── Upload avatar ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/auth/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = { ...profile, avatar: res.data.avatarUrl };
      setProfile(updated);
      if (setUser) setUser(updated);
    } catch (e) {
      alert("Upload avatar thất bại: " + (e.response?.data?.message || e.message));
    } finally { setAvatarUploading(false); }
  };

  /* ── Sau khi save edit profile ── */
  const handleSaved = (updatedUser) => {
    setProfile(updatedUser);
    if (setUser) setUser(updatedUser);
  };

  /* ── Share profile ── */
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Helpers ── */
  const memberDays = profile
    ? Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000)
    : 0;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (loading) return (
    <div className="profile-loading">
      <Header />
      <span>⏳ Đang tải...</span>
    </div>
  );

  return (
    <div className="profile-page">
      <Header />

      {/* ── Banner ── */}
      <div className="profile-banner" />

      {/* ── Avatar + tên + buttons ── */}
      <div className="profile-identity-row">

        {/* Avatar với nút camera */}
        <div className="profile-avatar-wrap">
          {profile?.avatar
            ? <img src={profile.avatar} alt="avatar" className="profile-avatar" />
            : <div className="profile-avatar-placeholder">🐱</div>
          }
          <label className="avatar-upload-btn" title="Đổi ảnh đại diện">
            {avatarUploading ? "⏳" : "📷"}
            <input
              type="file"
              accept="image/*"
              ref={avatarRef}
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Tên + country */}
        <div className="profile-name-block">
          <h1 className="profile-username">{profile?.username}</h1>
          <p className="profile-country">📍 {profile?.country || "Vietnam"}</p>
          {profile?.bio && (
            <p style={{ fontSize: "0.82rem", color: "#aaa", marginTop: 4 }}>{profile.bio}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="profile-action-btns">
          <button className="btn-edit-profile" onClick={() => setShowModal(true)}>
            ✏️ <span>Edit profile</span>
          </button>
          <button className="btn-share-profile" onClick={handleShare}>
            🔗 <span>{copied ? "Đã copy!" : "Share profile"}</span>
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + main ── */}
      <div className="profile-body">

        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="sidebar-card">
            <h3>Friends</h3>
            <p className="friends-count">0 friends</p>
          </div>

          <div className="sidebar-card">
            <h3>Stats</h3>
            <div className="stat-row">
              <div className="stat-icon-wrap">🎮</div>
              <div>
                <div className="stat-label">Games played</div>
                <div className="stat-value">{orders.length}</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-icon-wrap">📅</div>
              <div>
                <div className="stat-label">Member for</div>
                <div className="stat-value">{memberDays} days</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-icon-wrap">👍</div>
              <div>
                <div className="stat-label">Games liked</div>
                <div className="stat-value">0</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-icon-wrap">🔥</div>
              <div>
                <div className="stat-label">Playstreak</div>
                <div className="stat-value">1 day</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="profile-main">
          <div className="profile-tabs">
            <button className="tab-btn active">🎮 Games đã mua</button>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty">
              <div className="empty-icon">🛒</div>
              <p>Bạn chưa mua game nào</p>
              <button className="btn-browse" onClick={() => navigate("/games")}>
                Khám phá Games
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div key={order._id} className="order-card"
                  onClick={() => navigate(`/games/${order.game?.slug}`)}>
                  {order.game?.headerImage
                    ? <img src={order.game.headerImage} alt={order.game.name} className="order-card-thumb" />
                    : <div className="order-card-thumb-placeholder">🎮</div>
                  }
                  <div className="order-card-body">
                    <p className="order-card-name">{order.game?.name || "Game đã bị xoá"}</p>
                    <p className="order-card-price">
                      {order.priceAtPurchase === 0 ? "Free" : `${order.priceAtPurchase.toLocaleString()}đ`}
                    </p>
                    <p className="order-card-date">{fmtDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}