import api from "../services/api";

export const getDoctors = (params = {}) => api.get("/doctors", { params });

export const getDoctorById = (id) => api.get(`/doctors/${id}`);

export const getDoctorSchedule = (id) => api.get(`/doctors/${id}/schedules`);

export const getDoctorAvailability = (id, date) =>
  api.get(`/doctors/${id}/availability`, { params: { date } });
