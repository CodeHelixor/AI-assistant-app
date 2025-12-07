// Notification utility for push notifications and in-app notifications

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
};

export const scheduleCheckoutReminder = (checkoutDate) => {
  const now = new Date();
  const checkout = new Date(checkoutDate);
  const hoursUntilCheckout = (checkout - now) / (1000 * 60 * 60);

  if (hoursUntilCheckout > 0 && hoursUntilCheckout <= 24) {
    setTimeout(() => {
      showNotification('Check-out Reminder', {
        body: `Your check-out is today. Please ensure you're ready to leave by the check-out time.`,
        tag: 'checkout-reminder',
      });
    }, hoursUntilCheckout * 60 * 60 * 1000);
  }
};

export const sendWelcomeNotification = (propertyName) => {
  showNotification('Welcome!', {
    body: `Welcome to ${propertyName}! We hope you enjoy your stay.`,
    tag: 'welcome',
  });
};

export const sendWeatherAlert = (alert) => {
  showNotification('Weather Alert', {
    body: alert,
    tag: 'weather-alert',
  });
};



