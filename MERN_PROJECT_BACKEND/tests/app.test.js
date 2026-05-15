const express = require("express");
const request = require("supertest");
const cors = require("cors");

// Mini app بدون MongoDB connection
const app = express();
app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

describe("Health Check", () => {
  test("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("GET /health returns timestamp", async () => {
    const res = await request(app).get("/health");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("Unknown Routes", () => {
  test("GET /unknown returns 404", async () => {
    const res = await request(app).get("/unknown");
    expect(res.statusCode).toBe(404);
  });
});
