// const request = require("supertest");
// const app = require("../../src/app");
// const Todo = require("../../src/models/todo.model");

import supertest from "supertest";
import app from "../../server/src/app";
import Todo from "../../server/src/models/todo.model";

describe("GET /todos", () => {
  beforeEach(() => {
    Todo.storage = [];
  });

  test("should return empty array when no todos exist", async () => {
    // Your turn: write the test
    // 1. Make GET request to /todos
    const res = await request(app).get("/todos").expect(200);

    expect(res.body).toEqual([]);
  });

  test("should return array of todos when todos exist", async () => {
    const todo1 = new Todo({ title: "Test Todo 1" });
    const todo2 = new Todo({ title: "Test Todo 2" });
    todo1.save();
    todo2.save();

    const res = await request(app).get("/todos").expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("title", "Test Todo 1");
  });
});

describe("POST /todos", () => {
  beforeEach(() => {
    Todo.storage = [];
  });

  test("should create a new todo and return 201", async () => {
    const todoData = { title: "Test Todo 1", description: "Test description" };
    // Your challenge: write the test
    // 1. Send POST request to /todos with todo data
    const res = await request(app).post("/todos").send(todoData).expect(201);
    // 3. Expect response body to contain the created todo
    expect(res.body).toHaveProperty("title", "Test Todo 1");
    expect(res.body).toHaveProperty("description", "Test description");
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("completed", false);
  });
});

describe("GET /todos/:id", () => {
  beforeEach(() => {
    Todo.storage = [];
  });

  test("should return null when Id does not exist", async () => {
    // 1. Make GET request to /todos
    const res = await request(app).get("/todos/notfound-id").expect(404);

    expect(res.body).toEqual({ error: "Todo not found" });
  });

  test("should return exact todo when id exist", async () => {
    const todo1 = new Todo({ title: "Test Todo 1" });
    todo1.save();

    const res = await request(app).get(`/todos/${todo1.id}`).expect(200);

    expect(res.body).toHaveProperty("title", "Test Todo 1");
    expect(res.body).toHaveProperty("id", todo1.id);
  });
});

describe("PUT /todos/:id", () => {
  beforeEach(() => {
    Todo.storage = [];
  });
  test("should update existing todo and return 200", async () => {
    const todo = new Todo({
      title: "Orignal Title",
      description: "Orignal Description",
    });
    todo.save();

    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({
        title: "Updated Title",
        description: "Updated Description",
      })
      .expect(200);

    expect(res.body).toHaveProperty("title", "Updated Title");
    expect(res.body).toHaveProperty("description", "Updated Description");
  });

  test("should return 404 when updating non-existent todo", async () => {
    const res = await request(app)
      .put(`/todos/nonexistent-id`)
      .send({ title: "Updated Title" })
      .expect(404);

    expect(res.body).toEqual({ error: "Todo not found" });
  });
});

describe("DELETE /todos/:id", () => {
  beforeEach(() => {
    Todo.storage = [];
  });
});
