import express from "express";
import todoRoutes from "./routes/todo.routes.js";
import authRoutes from "./routes/auth.routes.js";
import protect from "./middleware/auth.js";
import path from "path";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";

// Main Express application setup
const limiter = new rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message: "too many API request in certain timeframe",
});
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(import.meta.dirname, "views"));
// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http:/localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(limiter());

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server Error" });
});

app.get("/", protect, async () => {
  res.render("Hello, World");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Todo API is running",
  });
});
app.get("/hello/:name", async (req, res) => {
  res.render("home", { name: req.params.name });
});

// ✅ Tell app to use them
app.use("/todos", protect, todoRoutes);
app.use("/auth", authRoutes);

export default app;
