import  { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

/**Login Functionality to navigate between guest user and admin user */
export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Guest login → goes to guest dashboard
  const loginAsGuest = () => {
    onLogin("guest");
    navigate("/guest");
  };

  // Admin login
  const loginAsAdmin = async () => {
    try {
      if (!name || !password) {
        setError("Name and password are required");
        return;
      }

      const res = await axios.post("http://localhost:3000/admins/login", {
        name,
        password,
      });

      if (res.data.success) {
        onLogin("admin");
        navigate("/admin");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404)
        setError("User not found. Please create an admin account.");
      else setError("Login failed");
    }
  };

  // Create first admin
  const createAdmin = async () => {
    try {
      if (!name || !password) {
        setError("Name and password are required");
        return;
      }

      const res = await axios.post("http://localhost:3000/admins/register", {
        name,
        password,
      });

      if (res.data.success || res.status === 201) {
        alert("Admin account created successfully!");
        setError("");
      } else {
        setError(res.data.message || "Failed to create admin");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) setError("Admin already exists");
      else setError("Error creating admin");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Welcome</h1>

      <div className="login-buttons">
        <button className="login-btn" onClick={loginAsGuest}>
          Login as Guest
        </button>

        <button
          className="login-btn admin-btn"
          onClick={() => setShowAdminForm(!showAdminForm)}
        >
          {showAdminForm ? "Close Admin Form" : "Admin"}
        </button>
      </div>

      {showAdminForm && (
        <div className="admin-form">
          <h3>Admin Login</h3>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <div className="form-actions">
            <button className="login-btn" onClick={loginAsAdmin}>
              Login
            </button>
            <button className="login-btn" onClick={createAdmin}>
              Create Admin
            </button>
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
