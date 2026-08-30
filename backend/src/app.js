import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import env from "./config/env.js";
// import healthRoutes from "./routes/health.routes.js";
// import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// const app = express();

// // Security headers
// app.use(helmet());

// // CORS — only allow the frontend origin
// app.use(
//   cors({
//     origin: env.clientOrigin,
//     credentials: true,
//   }),
// );

// // Request logging (dev-friendly format in development)
// app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

// // Parse JSON request bodies
// app.use(express.json());

// // Routes
// app.use("/api/health", healthRoutes);

// // 404 handler for unmatched routes
// app.use(notFound);

// // Centralized error handler — must be registered last
// app.use(errorHandler);

// export default app;
