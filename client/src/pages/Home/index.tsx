import { useState } from "react";
import Header from "../../layout/Header";
import { Products } from "../../components/Products";
import { ChatBox } from "../../components/ChatBox";

export default function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gray-50 relative">
        <Header />

        <div className="pt-20">
          <Products />
        </div>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none transition-transform ${
            isChatOpen ? "scale-0" : "scale-100"
          }`}
          aria-label="Open chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </>
  );
}
