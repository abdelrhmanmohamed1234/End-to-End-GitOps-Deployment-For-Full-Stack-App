const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

// Use environment variables or defaults
const host = DB_HOST || 'localhost';
const port = DB_PORT || '27017';
const user = DB_USER || '';
const password = DB_PASSWORD || '';
const database = DB_NAME || 'merndb';

// Build connection string
let MONGO_URI;
if (user && password) {
  MONGO_URI = `mongodb://${user}:${password}@${host}:${port}/${database}`;
} else {
  MONGO_URI = `mongodb://${host}:${port}/${database}`;
}

console.log(`Attempting to connect to MongoDB at: ${host}:${port}`);

// Connect DB
mongoose
  .connect(MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("✅ mongoDB is connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Middleware
app.use(express.json());
app.use(cors());

// Route
app.use("/user", require("./routes/user"));

app.listen(5000, () => console.log("Server is running on port 5000"));
