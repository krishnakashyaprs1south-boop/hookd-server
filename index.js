// ==========================
// index.js — main server file
// ==========================

require("dotenv").config();
const express = require("express");
app.set('trust proxy', 1);
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const cluster = require("cluster");
const os = require("os");

const app = express();

// ==========================
// Middleware Setup
// ==========================
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin resource sharing
app.use(express.json({ limit: "1mb" })); // Parse JSON bodies
app.use(compression()); // GZIP compression

// Rate limiter to protect from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 1000, // Max requests per IP
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// ==========================
// Example Routes
// ==========================
app.get("/", (req, res) => {
  res.status(200).send("✅ Server is running securely and efficiently!");
});

app.post("/hash", async (req, res) => {
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ error: "Password field required" });

  try {
    const hash = await bcrypt.hash(password, 12);
    res.json({ hash });
  } catch (err) {
    res.status(500).json({ error: "Error hashing password" });
  }
});

// ==========================
// Clustering for performance
// ==========================
if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  console.log(`🧠 Master process started. Spawning ${cpuCount} workers...`);

  // Fork a worker for each CPU core
  for (let i = 0; i < cpuCount; i++) cluster.fork();

  // Restart worker if one dies
  cluster.on("exit", (worker) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // ==========================
  // Start Server
  // ==========================
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
  });
}
