// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Safe check at module level with try-catch
let HAS_NOTIFICATION_SUPPORT = false;
try {
  HAS_NOTIFICATION_SUPPORT = typeof window !== 'undefined' && 
                             typeof window.Notification !== 'undefined';
} catch (e) {
  HAS_NOTIFICATION_SUPPORT = false;
}

export function useNotifications(token) {
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (!HAS_NOTIFICATION_SUPPORT) return 'unsupported';
    try {
      return window.Notification.permission;
    } catch (e) {
      return 'unsupported';
    }
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && token && HAS_NOTIFICATION_SUPPORT) {
      checkSubscription();
    }
  }, [token]);

  const checkSubscription = async () => {
    if (!HAS_NOTIFICATION_SUPPORT) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          '/service-worker.js'
        );
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!HAS_NOTIFICATION_SUPPORT) return false;
    
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = async () => {
    if (!HAS_NOTIFICATION_SUPPORT) {
      alert('Notifications are not supported on this device');
      return false;
    }

    setLoading(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert('Please enable notifications in your browser settings');
        setLoading(false);
        return false;
      }

      const registration = await registerServiceWorker();

      const { data: { publicKey } } = await axios.get(
        `${API}/notifications/vapid-public-key`
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await axios.post(
        `${API}/notifications/subscribe`,
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey('p256dh'))
              )
            ),
            auth: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey('auth'))
              )
            ),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      setLoading(false);
      return false;
    }
  };

  const unsubscribeFromNotifications = async () => {
    if (!HAS_NOTIFICATION_SUPPORT) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await axios.post(
          `${API}/notifications/unsubscribe`,
          { endpoint: subscription.endpoint },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }

      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      setLoading(false);
      return false;
    }
  };

  const sendTestNotification = async () => {
    try {
      await axios.post(
        `${API}/notifications/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  return {
    notificationPermission,
    isSubscribed,
    loading,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendTestNotification,
  };
}
