import SessionHistory from "@/components/Cms/ChatSessions/SessionHistory";
import Sidebar from "@/components/Cms/Sidebar";
import Header from "@/layout/Header";

export default function ChatSessionsPage() {
  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="flex pt-3">
          <Sidebar />
          <div className="ml-64 flex-1 pt-12 bg-gray-100 overflow-hidden">
            <SessionHistory />
          </div>
        </div>
      </div>
    </>
  );
}
