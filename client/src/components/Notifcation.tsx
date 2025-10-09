import { useEffect, useState } from "react";

type NotificationType = "success" | "error";

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const getBgColor = (type: NotificationType) => {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-700";
  }
};

export default function Notification({
  message,
  type,
  onClose,
  duration = 2000,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);

    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration - 300);

    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-6 right-6 min-w-[240px] px-4 py-3 rounded-lg shadow-lg text-white ${getBgColor(
        type
      )} z-50 flex items-center transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button
        className="ml-4 text-white hover:text-gray-200 text-xl font-bold"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
