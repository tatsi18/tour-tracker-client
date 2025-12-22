// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Check support once at module level
const HAS_NOTIFICATION_SUPPORT = typeof window !== 'undefined' && 
                                  typeof Notification !== 'undefined';

export function useNotifications(token) {
  const [notificationPermission, setNotificationPermission] = useState(
    HAS_NOTIFICATION_SUPPORT ? Notification.permission : 'unsupported'
  );
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

  const
