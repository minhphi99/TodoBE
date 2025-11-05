# Todo API

A RESTful API for managing todos built with Node.js, Express, and tested with Jest using TDD approach.

## Project Structure

```
todo-api/
├── src/
│   ├── controllers/     # Route handlers and business logic
│   ├── models/         # Data models and validation
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middleware functions
│   └── app.js         # Express app configuration
├── tests/
│   ├── controllers/    # Controller unit tests
│   ├── models/        # Model unit tests
│   └── integration/   # Integration tests
├── index.js           # Server entry point
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## API Endpoints

*To be implemented using TDD approach*

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
