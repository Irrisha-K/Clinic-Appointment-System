import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

if (!env.mongoUri) {
  throw new Error("MONGO_URI is not defined in .env");
}

export default env;
