import Todo from "../../server/src/models/todo.model";

describe("Todo Model", () => {
  describe("Save functionality", () => {
    test("should save and return success message", () => {
      const todo = new Todo({
        title: "Learn Node.js",
        description: "Complete the todo API project",
      });

      const result = todo.save();

      expect(todo.title).toBe("Learn Node.js");
      expect(todo.description).toBe("Complete the todo API project");
      expect(result).toBe("Todo saved successfully");
    });

    test("should store todo in Todo.storage when saved", () => {
      // Clear storage for this test
      Todo.storage = [];

      // Create and save a todo
      const todo = new Todo({
        title: "Learn Node.js",
        description: "Complete the todo API project",
      });

      todo.save();

      expect(Todo.storage.length).toBe(1);
      expect(Todo.storage[0].id).toBe(todo.id);
      expect(Todo.storage[0].title).toBe(todo.title);
    });

    test("should update existing todo when saved again", () => {
      Todo.storage = [];

      // Create and save a todo
      const todo = new Todo({
        title: "Original Title",
        description: "Original Description",
      });
      todo.save();

      // Modify the todo
      todo.title = "Updated Title";
      todo.description = "Updated Description";

      // Save again
      todo.save();

      expect(Todo.storage.length).toBe(1);
      expect(Todo.storage[0].title).toBe("Updated Title");
      expect(Todo.storage[0].description).toBe("Updated Description");
      expect(Todo.storage[0].id).toBe(todo.id);
    });
  });

  describe("Find functionality", () => {
    test("should return empty array when no todos are saved", () => {
      // Clear storage
      Todo.storage = [];

      // Call findAll
      const result = Todo.findAll();

      // Your turn: write expectations
      expect(result).toEqual([]);
      // What should result be when storage is empty?
    });

    test("should return all saved todos", () => {
      // Clear storage
      Todo.storage = [];

      // Create and save multiple todos
      const todo1 = new Todo({
        title: "First Todo",
        description: "First description",
      });
      const todo2 = new Todo({
        title: "Second Todo",
        description: "Second description",
      });

      todo1.save();
      todo2.save();

      // Call findAll
      const result = Todo.findAll();

      // Your turn: write expectations
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0].title).toBe("First Todo");
      expect(result[0].description).toBe("First description");
      expect(result[0].id).toBe(todo1.id);

      expect(result[1].title).toBe("Second Todo");
      expect(result[1].description).toBe("Second description");
      expect(result[1].id).toBe(todo2.id);
    });

    test("should return todo data when found by ID", () => {
      Todo.storage = [];
      const todo = new Todo({
        title: "Test Todo",
        description: "Test Description",
      });
      todo.save();
      const result = Todo.findById(todo.id);

      expect(result).not.toBe(null);
      expect(result.id).toBe(todo.id);
      expect(result.title).toBe(todo.title);
      expect(result.description).toBe(todo.description);
    });

    test("should return null when todo not found by ID", () => {
      Todo.storage = [];

      const result = Todo.findById("nonexistent-id");

      expect(result).toBe(null);
    });
  });

  describe("Validation", () => {
    test("should create a valid todo with required fields", () => {
      const todoData = {
        title: "Learn Node.js",
        description: "Complete the todo API project",
      };

      const todo = new Todo(todoData);

      expect(todo.title).toBe("Learn Node.js");
      expect(todo.description).toBe("Complete the todo API project");
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeInstanceOf(Date);
    });

    test("should throw error when title is missing", () => {
      const todoData = {
        description: "No title provided",
      };

      expect(() => {
        new Todo(todoData);
      }).toThrow("Title is required");
    });
  });
});
