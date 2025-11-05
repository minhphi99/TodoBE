import express from "express";
import todoRoutes from "./routes/todo.routes.js";
import authRoutes from "./routes/auth.routes.js";
import protect from "./middleware/auth.js";

// Main Express application setup

const app = express();

// Middleware
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Todo API is running",
  });
});

// ✅ Tell app to use them
app.use("/todos", protect, todoRoutes);
app.use("/auth", authRoutes);

export default app;
