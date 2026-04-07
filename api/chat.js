// Vercel serverless function — wraps the shared Express handler
// Environment variables are set in the Vercel dashboard (no .env needed)
const { chatHandler } = require("../server/routes/chat.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  return chatHandler(req, res);
};
