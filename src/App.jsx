import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import CalendarPage from "./CalendarPage";
import NavBar from "./NavBar";
import ReportsPage from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import ResetPasswordPage from "./ResetPasswordPage";

function AppContent() {
  const { isAuthenticated, loading, login, logout, user } = useAuth();
  const [showResetPassword, setShowResetPassword] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  // Show reset password page
  if (showResetPassword) {
    return (
      <ResetPasswordPage onBackToLogin={() => setShowResetPassword(false)} />
    );
  }

  // Show login page with forgot password option
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={login}
        onForgotPassword={() => setShowResetPassword(true)}
      />
    );
  }

  // Show main app
  return (
    <BrowserRouter>
      <NavBar logout={logout} user={user} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
