import api from "../services/api";

export const createAppointment = (payload) =>
  api.post("/appointments", payload);

export const getMyAppointments = () => api.get("/appointments/my");

export const getAppointments = (params = {}) =>
  api.get("/appointments", { params });

export const getTodayAppointments = (params = {}) =>
  api.get("/appointments/today", { params });

export const searchAppointments = (query) =>
  api.get("/appointments/search", { params: { query } });

export const confirmAppointment = (id) =>
  api.patch(`/appointments/${id}/confirm`);

export const cancelAppointment = (id, payload = {}) =>
  api.patch(`/appointments/${id}/cancel`, payload);

export const rescheduleAppointment = (id, payload) =>
  api.patch(`/appointments/${id}/reschedule`, payload);

export const completeAppointment = (id) =>
  api.patch(`/appointments/${id}/complete`);

export const markNoShow = (id) => api.patch(`/appointments/${id}/no-show`);

export const createWalkIn = (payload) =>
  api.post("/appointments/walk-in", payload);
