// src/routes/todo.routes.js
import express from "express";
import * as todoController from "../controllers/todo.controller.js"; // note the .js extension
import protect from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const todoRoutes = express.Router();
todoRoutes.use(protect);

// Routes
todoRoutes.get("/", todoController.getAllTodos);
todoRoutes.post("/", todoController.createTodo);
todoRoutes.get("/:id", todoController.getTodoById);
todoRoutes.put("/:id", todoController.updateTodoById);
todoRoutes.delete("/:id", todoController.deleteTodo);

export default todoRoutes;
