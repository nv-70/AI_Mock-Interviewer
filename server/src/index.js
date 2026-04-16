require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resume");
const roleRoutes = require("./routes/roles");
const interviewRoutes = require("./routes/interview");
const adminRoutes = require("./routes/admin");

const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// ================== ✅ CORS (FIXED) ==================
app.use(
  cors({
    origin: ["http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ✅ Handle preflight requests
app.options("*", cors());

// ================== ✅ SECURITY ==================
app.use(helmet());

// ================== ✅ BODY PARSING ==================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ================== ✅ LOGGING ==================
app.use(morgan("combined"));

// ================== ✅ RATE LIMIT ==================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);

// ================== ✅ DB CONNECTION ==================
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/mock_interviewer",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ================== ✅ ROUTES ==================
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/admin", adminRoutes);

// ================== ✅ ERROR HANDLER ==================
app.use(errorHandler);

// ================== ✅ 404 ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================== ✅ SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
