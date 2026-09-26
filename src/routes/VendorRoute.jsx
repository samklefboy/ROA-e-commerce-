import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ProtectedRoute from "./ProtectedRoute";

export default function VendorRoute() {
  const { hasStore } = useAuthStore();

  return (
    <ProtectedRoute>
      {hasStore ? <Outlet /> : <Navigate to="/create-store" replace />}
    </ProtectedRoute>
  );
}
