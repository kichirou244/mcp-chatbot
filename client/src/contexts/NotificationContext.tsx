import { createContext, useContext, useState, type ReactNode } from "react";
import Notification from "../components/Notifcation";

type NotificationType = "success" | "error";

const NotificationContext = createContext<
  (msg: string, type: NotificationType) => void
>(() => {});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notif, setNotif] = useState<{
    msg: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = (msg: string, type: NotificationType) =>
    setNotif({ msg, type });

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {notif && (
        <Notification
          message={notif.msg}
          type={notif.type}
          onClose={() => setNotif(null)}
        />
      )}
    </NotificationContext.Provider>
  );
};
