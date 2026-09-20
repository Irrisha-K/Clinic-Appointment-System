import api from "../services/api";

// Public endpoint — returns active departments for guests/patients,
// all departments for admin (backend decides based on token).
export const getDepartments = () => api.get("/departments");
