// src/components/NotificationSettings.jsx
import React, { useState, useEffect } from "react";

export default function NotificationSettings({ token }) {
  const [hookLoaded, setHookLoaded] = useState(false);
  const [NotificationHook, setNotificationHook] = useState(null);

  // Safe check for Notification API
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    // Only load the hook if notifications are supported
    if (notificationSupported) {
      import('../hooks/useNotifications').then(module => {
        setNotificationHook(() => module.useNotifications);
        setHookLoaded(true);
      });
    } else {
      setHookLoaded(true);
    }
  }, [notificationSupported]);

  // Show loading while checking
  if (!hookLoaded) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <p>Loading notification settings...</p>
      </div>
    );
  }

  // Check if notifications are supported
  if (!notificationSupported) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "1px solid #ffc107",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Notifications Not Supported</h3>
        <p style={{ margin: 0 }}>
          Push notifications are not supported on iOS devices. This feature works on desktop browsers and Android devices.
        </p>
      </div>
    );
  }

  // If we get here, notifications are supported and hook is loaded
  return <NotificationSettingsWithHook token={token} useNotifications={NotificationHook} />;
}

// Separate component that uses the hook
function NotificationSettingsWithHook({ token, useNotifications }) {
  const {
    notificationPermission,
    isSubscribed,
    loading,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendTestNotification,
  } = useNotifications(token);

  const handleSubscribe = async () => {
    const success = await subscribeToNotifications();
    if (success) {
      alert(
        "Successfully subscribed to notifications! You will receive alerts 90 and 60 minutes before your tours."
      );
    } else {
      alert(
        "Failed to subscribe to notifications. Please check your browser settings."
      );
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribeFromNotifications();
    if (success) {
      alert("Successfully unsubscribed from notifications.");
    }
  };

  const handleTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      alert("Test notification sent! Check your notifications.");
    } else {
      alert("Failed to send test notification.");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>
        🔔 Tour Notifications
      </h3>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
          Get notified <strong>90 minutes</strong> and{" "}
          <strong>60 minutes</strong> before your tours start!
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor:
                notificationPermission === "granted"
                  ? "#22c55e"
                  : notificationPermission === "denied"
                  ? "#ef4444"
                  : "#fbbf24",
            }}
          />
          <span style={{ fontSize: "14px", color: "#666" }}>
            Permission: <strong>{notificationPermission}</strong>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: isSubscribed ? "#22c55e" : "#9ca3af",
            }}
          />
          <span style={{ fontSize: "14px", color: "#666" }}>
            Status:{" "}
            <strong>{isSubscribed ? "Subscribed" : "Not Subscribed"}</strong>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: loading ? "#9ca3af" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Subscribing..." : "🔔 Enable Notifications"}
          </button>
        ) : (
          <>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#9ca3af" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Unsubscribing..." : "🔕 Disable Notifications"}
            </button>
            <button
              onClick={handleTest}
              style={{
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              📨 Send Test
            </button>
          </>
        )}
      </div>

      {notificationPermission === "denied" && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            backgroundColor: "#fee2e2",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#991b1b",
          }}
        >
          ⚠️ Notifications are blocked. Please enable them in your browser
          settings.
        </div>
      )}

      {isSubscribed && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            backgroundColor: "#d1fae5",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#065f46",
          }}
        >
          ✅ You're all set! You'll receive notifications at 90 and 60 minutes
          before each tour.
        </div>
      )}
    </div>
  );
}
