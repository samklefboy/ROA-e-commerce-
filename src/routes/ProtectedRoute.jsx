import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // still checking localStorage
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "2px solid #1b311b",
              borderTopColor: "#c9bc4c",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 10px",
            }}
          />
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // remember where user was trying to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
