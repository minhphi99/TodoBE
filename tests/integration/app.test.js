const request = require("supertest");
const app = require("../../server/src/app");

describe("Health Check", () => {
  test("GET/health should return status OK", async () => {
    const res = await request(app).get("/health").expect(200);

    expect(res.body).toEqual({
      status: "OK",
      message: "Todo API is running",
    });
  });
});
