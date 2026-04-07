require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { chatHandler } = require("./routes/chat.js");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve the mockup frontend
app.use(express.static(path.join(__dirname, "..", "mockup")));

// API routes
app.post("/api/chat", chatHandler);

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "mockup", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\nDiffs Orchestrator running at http://localhost:${PORT}\n`);
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn("⚠  No API keys found. Copy .env.example to .env and add your keys.\n");
  }
});
