import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import webhookRoutes from "./routes/webhook.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // 🔥 logging

// Routes
app.use("/api/webhook", webhookRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});