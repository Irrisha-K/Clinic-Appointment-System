import api from "../services/api";

export const getDoctors = (params = {}) => api.get("/doctors", { params });

export const getDoctorById = (id) => api.get(`/doctors/${id}`);

export const createDoctor = (payload) => api.post("/doctors", payload);

export const updateDoctor = (id, payload) => api.put(`/doctors/${id}`, payload);

export const updateDoctorStatus = (id, status) =>
  api.patch(`/doctors/${id}/status`, { status });

export const deleteDoctor = (id) => api.delete(`/doctors/${id}`);

export const getDoctorSchedule = (id) => api.get(`/doctors/${id}/schedules`);

export const createDoctorSchedule = (doctorId, payload) =>
  api.post(`/doctors/${doctorId}/schedules`, payload);

export const updateDoctorSchedule = (doctorId, scheduleId, payload) =>
  api.put(`/doctors/${doctorId}/schedules/${scheduleId}`, payload);

export const updateDoctorScheduleStatus = (doctorId, scheduleId, isActive) =>
  api.patch(`/doctors/${doctorId}/schedules/${scheduleId}/status`, {
    isActive,
  });

export const deleteDoctorSchedule = (doctorId, scheduleId) =>
  api.delete(`/doctors/${doctorId}/schedules/${scheduleId}`);

export const getDoctorAvailability = (id, date) =>
  api.get(`/doctors/${id}/availability`, { params: { date } });
