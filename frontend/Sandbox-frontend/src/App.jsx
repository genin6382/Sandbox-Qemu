import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GuestDashboard from "./pages/GuestDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const navigate = useNavigate();

  const handleLogin = (role) => {
    const newUser = { role };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      navigate("/admin");
    } else if (user.role === "guest") {
      navigate("/guest");
    }
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/guest"
        element={
          <ProtectedRoute user={user} role="guest">
            <GuestDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} role="admin">
            <AdminDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
