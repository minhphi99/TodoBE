// src/routes/todo.routes.js
import express from "express";
import * as todoController from "../controllers/todo.controller.js"; // note the .js extension
import protect from "../middleware/auth.js";
import { authrorizeRoles } from "../middleware/authorizeRoles.js";

const todoRoutes = express.Router();
todoRoutes.use(protect);

// Routes
todoRoutes.get("/", todoController.getAllTodos);
todoRoutes.post("/", todoController.createTodo);
todoRoutes.get("/:id", todoController.getTodoById);
todoRoutes.put("/:id", todoController.updateTodoById);
todoRoutes.delete("/:id", authrorizeRoles, todoController.deleteTodo);

export default todoRoutes;