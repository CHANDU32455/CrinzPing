import { useEffect } from "react";

export function useBrowserNotification() {
  // Ask permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (title: string, body: string) => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  return { showNotification };
}
