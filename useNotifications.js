// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useNotifications(token) {
  // Safe check for Notification API
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  
  const [notificationPermission, setNotificationPermission] = useState(
    notificationSupported ? Notification.permission : 'unsupported'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && token && notificationSupported) {
      checkSubscription();
    }
  }, [token, notificationSupported]);

  const checkSubscription = async () => {
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
    if (!notificationSupported) {
      console.error('Notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
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
    if (!notificationSupported) {
      console.error('Notifications not supported on this device');
      return false;
    }

    setLoading(true);
    try {
      // Request permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert('Please enable notifications in your browser settings');
        setLoading(false);
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Get VAPID public key from server
      const { data: { publicKey } } = await axios.get(
        `${API}/notifications/vapid-public-key`
      );

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
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
    if (!notificationSupported) {
      return false;
    }

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