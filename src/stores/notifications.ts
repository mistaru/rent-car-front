import { defineStore } from 'pinia';
import { ref } from 'vue';

let _counter = 0;

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<{ id: number; type: string; message: string }[]>([]);

  const addNotification = (type: 'success' | 'error' | 'warning', message: string, timeout = 5000) => {
    // Remove any existing notification with the same message immediately (no animation delay)
    notifications.value = notifications.value.filter(n => n.message !== message);

    const id = ++_counter;
    notifications.value.push({ id, type, message });

    setTimeout(() => removeNotification(id), timeout);
  };

  const removeNotification = (id: number) => {
    const notificationElement = document.querySelector(`[data-id="${id}"]`);

    if (notificationElement instanceof HTMLElement) {
      notificationElement.style.opacity = '0';
    }

    setTimeout(() => {
      notifications.value = notifications.value.filter(notif => notif.id !== id);
    }, 500);
  };

  return { notifications, addNotification, removeNotification };
});
