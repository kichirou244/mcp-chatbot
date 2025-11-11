import { Helmet } from "react-helmet-async";
import Auth from "@/components/Auth/Auth";

export default function AuthPage() {
  return (
    <>
      <Helmet>
        <title>Đăng nhập</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <Auth />
      </div>
    </>
  );
}
