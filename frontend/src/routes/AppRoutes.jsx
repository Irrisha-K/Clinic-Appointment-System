import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PatientDashboard from "../pages/PatientDashboard";
import ReceptionistDashboard from "../pages/ReceptionistDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root to login for now; will become a public home page later */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role dashboards (unprotected for now — protection added in Auth module) */}
      <Route path="/patient/dashboard" element={<PatientDashboard />} />
      <Route
        path="/receptionist/dashboard"
        element={<ReceptionistDashboard />}
      />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
