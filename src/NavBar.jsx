// src/NavBar.jsx
import React from "react";
import { Link } from "react-router-dom";

function NavBar({ logout, user }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>🏛️ Tour Tracker</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>
          Calendar
        </Link>
        <Link to="/reports" style={styles.link}>
          Reports
        </Link>
        <Link to="/settings" style={styles.link}>
          Settings
        </Link>
      </div>
      <div style={styles.userSection}>
        <span style={styles.username}>👤 {user?.username}</span>
        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// Simple inline styles for immediate visual effect
const styles = {
  nav: {
    backgroundColor: "#343a40",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  logo: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
  },
  links: {
    display: "flex",
    gap: "20px",
  },
  link: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "16px",
    padding: "5px 10px",
    borderRadius: "4px",
    transition: "background-color 0.3s",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  username: {
    color: "#ffffff",
    fontSize: "14px",
  },
  logoutBtn: {
    padding: "8px 16px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default NavBar;
