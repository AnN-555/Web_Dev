import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./profile.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const IMAGE_BASE_URL = API_BASE_URL;

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/database/")) return `${IMAGE_BASE_URL}${url}`;
  return `${IMAGE_BASE_URL}/database/${url}`;
};

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
  const [msg, setMsg] = useState({ type: "", text: "" });

  const setSuccess = (t) => setMsg({ type: "success", text: t });
  const setError   = (t) => setMsg({ type: "error",   text: t });
  const clearMsg   = ()  => setMsg({ type: "", text: "" });

  const handleInfoSave = async () => {
    clearMsg();
    setLoading(true);
    try {
      // api instance có baseURL rồi, chỉ cần path /api/users/profile
      const res = await api.put("/api/users/profile", form);
      setSuccess("Update success!");
      onSaved(res.data.user);
    } catch (e) {
      setError(e.response?.data?.message || "Error");
    } finally { setLoading(false); }
  };

  const handlePwSave = async () => {
    clearMsg();
    if (pw.newPassword !== pw.confirmPassword)
      return setError("New password is not matched");
    if (pw.newPassword.length < 6)
      return setError("Password has to be at least 6 characters");
    setLoading(true);
    try {
      await api.put("/api/users/change-password", {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      });
      setSuccess("Password has been changed!");
      setPw({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setError(e.response?.data?.message || "Current password is not correct");
    } finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); clearMsg(); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Adjust profile</h2>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === "info" ? "active" : ""}`}
            onClick={() => switchTab("info")}>Info</button>
          <button className={`modal-tab ${tab === "password" ? "active" : ""}`}
            onClick={() => switchTab("password")}>Change password</button>
        </div>

        {tab === "info" && (
          <>
            <div className="form-group">
              <label>Username</label>
              <input value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Display username" />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                placeholder="Vietnam" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Short bio..." />
            </div>
          </>
        )}

        {tab === "password" && (
          <>
            <div className="form-group">
              <label>Current password</label>
              <input type="password" value={pw.oldPassword}
                onChange={e => setPw({ ...pw, oldPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input type="password" value={pw.newPassword}
                onChange={e => setPw({ ...pw, newPassword: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
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
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" disabled={loading}
              onClick={tab === "info" ? handleInfoSave : handlePwSave}>
              {loading ? "Saving..." : "Saved"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TRANG PROFILE CHÍNH
───────────────────────────────────────── */
export default function ProfilePage() {
  const { user: authUser, setUser } = useAuth();
  const navigate  = useNavigate();
  const avatarRef = useRef(null);

  const [profile,         setProfile]         = useState(null);
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copied,          setCopied]          = useState(false);

  useEffect(() => {
    if (!authUser) { navigate("/login"); return; }
    (async () => {
      try {
        const [pRes, oRes] = await Promise.all([
          api.get("/api/users/profile"),   // baseURL + /api/users/profile
          api.get("/api/orders"),           // baseURL + /api/orders
        ]);
        // api.get trả về axios response, .data = payload backend
        // profile backend: { user: {...} }
        // orders backend:  { success, data: [...] }
        setProfile(pRes.data.user);
        setOrders(oRes.data?.data || []);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally { setLoading(false); }
    })();
  }, [authUser]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.post("/api/auth/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = { ...profile, avatar: res.data.avatarUrl };
      setProfile(updated);
      if (setUser) setUser(prev => ({ ...prev, avatar: res.data.avatarUrl }));
    } catch (e) {
      alert("Upload thất bại: " + (e.response?.data?.message || e.message));
    } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  };

  const handleSaved = (updatedUser) => {
    setProfile(updatedUser);
    if (setUser) setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const memberDays = profile
    ? Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000)
    : 0;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

  if (loading) return <div className="profile-loading">⏳ Loading...</div>;

  return (
    <div className="profile-page">
      <div className="profile-banner" />

      <div className="profile-identity-row">
        <div className="profile-avatar-wrap">
          <img
            src={getImageUrl(profile?.avatar)}
            alt="avatar"
            className="profile-avatar"
            style={{ display: profile?.avatar ? "block" : "none" }}
            onError={e => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="profile-avatar-placeholder"
            style={{ display: profile?.avatar ? "none" : "flex" }}>
            🐱
          </div>
          <label className="avatar-upload-btn" title="Change avatar">
            {avatarUploading ? "⏳" : "📷"}
            <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="profile-name-block">
          <h1 className="profile-username">{profile?.username}</h1>
          <p className="profile-country">📍 {profile?.country || "Vietnam"}</p>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        <div className="profile-action-btns">
          <button className="btn-edit-profile" onClick={() => setShowModal(true)}>
            ✏️ <span>Edit profile</span>
          </button>
          <button className="btn-share-profile" onClick={handleShare}>
            🔗 <span>{copied ? "Đã copy!" : "Share"}</span>
          </button>
        </div>
      </div>

      <div className="profile-body">
        <aside className="profile-sidebar">
          <div className="sidebar-card">
            <h3>Friends</h3>
            <p className="friends-count">...</p>
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
                <div className="stat-value">...</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-icon-wrap">🔥</div>
              <div>
                <div className="stat-label">Playstreak</div>
                <div className="stat-value">... day</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-tabs">
            <button className="tab-btn active">🎮 Games has been bought</button>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty">
              <div className="empty-icon">🛒</div>
              <p>You haven't bought any game</p>
              <button className="btn-browse" onClick={() => navigate("/games")}>
                Explore more games
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map(order => (
                <div key={order._id} className="order-card"
                  onClick={() => navigate(`/games/${order.game?.slug}`)}>
                  <img
                    src={getImageUrl(order.game?.headerImage)}
                    alt={order.game?.name || "game"}
                    className="order-card-thumb"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="order-card-thumb-placeholder">🎮</div>
                  <div className="order-card-body">
                    <p className="order-card-name">{order.game?.name || "Game is deleted"}</p>
                    <p className="order-card-price">
                      {order.priceAtPurchase === 0
                        ? "🆓 Free"
                        : `💰 ${order.priceAtPurchase.toLocaleString("vi-VN")}đ`}
                    </p>
                    <p className="order-card-date">🗓 {fmtDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

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
