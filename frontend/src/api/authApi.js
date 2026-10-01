import api from "../services/api";

export const registerPatient = (data) => api.post("/auth/register", data);

export const login = (data) => api.post("/auth/login", data);

export const getMe = () => api.get("/auth/me");
