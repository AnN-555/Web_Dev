import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import "./profile.css";






const Profile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);

  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await userAPI.getProfile();
    setProfile(res.data);
    setUsername(res.data.username);
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    await userAPI.updateProfile({
      username
    });

    alert("Profile updated");
  };

  const changePassword = async (e) => {
    e.preventDefault();

    await userAPI.changePassword({
      oldPassword,
      newPassword
    });

    alert("Password updated");
    setOldPassword("");
    setNewPassword("");
  };

  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">
      <div className="container">

        <h1 className="profile-title">
          <i className="fas fa-user"></i> Profile
        </h1>

        {/* USER INFO */}
        <div className="profile-card">
          <h2>Account Information</h2>

          <div className="profile-info">
            <p><b>Username:</b> {profile.username}</p>
            <p><b>Email:</b> {profile.email}</p>
            <p><b>Joined:</b> {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* UPDATE USERNAME */}
        <form className="profile-card" onSubmit={updateProfile}>
          <h2>Edit Username</h2>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button className="btn btn-primary">
            Update Profile
          </button>
        </form>

        {/* CHANGE PASSWORD */}
        <form className="profile-card" onSubmit={changePassword}>
          <h2>Change Password</h2>

          <input
            type="password"
            placeholder="Old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button className="btn btn-primary">
            Change Password
          </button>
        </form>

      </div>
    </div>
  );
};

export default Profile;