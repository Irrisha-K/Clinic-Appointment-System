import api from "../services/api";

// Public/guest-friendly on the backend (optionalAuthenticate) — the shared
// axios instance already attaches a JWT automatically if one exists in
// localStorage, so this one function correctly serves both guest and
// logged-in patient bookings.
export const createAppointment = (payload) =>
  api.post("/appointments", payload);
