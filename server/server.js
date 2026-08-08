const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");

// Set up allowed origins from environment variables
const allowedOrigins = [
  process.env.SECONDARY_URL, // optional secondary URL
  process.env.CLIENT_URL, // primary client URL
  "http://localhost:5173", // local development (Vite default)
  "http://localhost:5174", // Vite fallback port
  "http://localhost:3000", // if client runs on 3000
].filter(Boolean); // removes any undefined/null values

console.log("Allowed CORS origins:", allowedOrigins);
console.log("Environment CLIENT_URL:", process.env.CLIENT_URL);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS check - Request origin:", origin);
    console.log("CORS check - Allowed origins:", allowedOrigins);

    // allow requests with no origin - mobile apps, Postman, etc.
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("CORS: Origin allowed:", origin);
      callback(null, true);
    } else {
      console.log("CORS: Origin NOT allowed:", origin);
      console.log("CORS: Available origins:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  exposedHeaders: ["Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS before any routes
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Add this after your CORS configuration
app.use((req, res, next) => {
  console.log("CORS Headers:", {
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
  });
  next();
});

// Add this after your CORS configuration for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    authorization: req.headers.authorization,
    body: req.body,
  });
  next();
});

// MongoDB connection configuration
const constructMongoURI = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const username = encodeURIComponent(process.env.MONGODB_USERNAME || "");
  const password = encodeURIComponent(process.env.MONGODB_PASSWORD || "");
  const cluster = process.env.MONGODB_CLUSTER;
  const database = process.env.MONGODB_DATABASE;

  if (!cluster || !database) {
    console.warn("MongoDB config missing. Set MONGODB_URI or MONGODB_CLUSTER/MONGODB_DATABASE.");
    return null;
  }

  return `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
};

const mongoURI = constructMongoURI();

if (mongoURI) {
  mongoose.connect(mongoURI, {
    // added options for better stability
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).catch((err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("connected", () => {
    console.log(`Connected to MongoDB ${mongoose.connection.name}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
} else {
  console.warn("MongoDB connection skipped because no URI or cluster/database were provided.");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
const authRouter = require("./routes/authRoutes");
const petRouter = require("./routes/petRoutes");
const groomerRouter = require("./routes/groomerRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");

app.use("/api/auth", authRouter);
app.use("/api/pets", petRouter);
app.use("/api/groomers", groomerRouter);
app.use("/api/appointments", appointmentRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
