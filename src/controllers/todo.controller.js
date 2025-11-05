// const Todo = require("../models/todo.model");
import Todo from "../models/todo.model.js";

export const createTodo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    const todo = await Todo.create({ title, description, userId });
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
    res.status(201).json(todos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTodoById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const todo = await Todo.findOne({ id, userId });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTodoById = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId, req.user, req.params.id);
    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Task not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await Todo.findOneAndDelete({ id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted succesfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
