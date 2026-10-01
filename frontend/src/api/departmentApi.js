import api from "../services/api";

export const getDepartments = () => api.get("/departments");

export const createDepartment = (payload) => api.post("/departments", payload);

export const updateDepartment = (id, payload) =>
  api.put(`/departments/${id}`, payload);

export const updateDepartmentStatus = (id, status) =>
  api.patch(`/departments/${id}/status`, { status });

export const deleteDepartment = (id) => api.delete(`/departments/${id}`);
