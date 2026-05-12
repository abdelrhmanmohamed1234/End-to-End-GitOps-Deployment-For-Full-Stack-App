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

// Use environment variables
const host = DB_HOST || 'mongodb-service';
const port = DB_PORT || '27017';
const user = DB_USER;
const password = DB_PASSWORD;
const database = DB_NAME || 'merndb';

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
};

// Build connection string with authSource=admin
let MONGO_URI;
if (user && password) {
  MONGO_URI = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
  console.log('Connecting with authentication to MongoDB');
} else {
  MONGO_URI = `mongodb://${host}:${port}/${database}`;
  console.log('Connecting without authentication to MongoDB');
}

console.log(`Attempting to connect to MongoDB at: ${host}:${port}`);
console.log(`Database: ${database}`);

// Connect DB
mongoose
  .connect(MONGO_URI, mongoOptions)
  .then(() => console.log("✅ MongoDB is connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Middleware
app.use(express.json());
app.use(cors());

// Route
app.use("/user", require("./routes/user"));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.listen(5000, () => console.log("Server is running on port 5000"));
