require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/land", require("./routes/landRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api", require("./routes/dataRoutes"));

app.get("/api/health", (req,res) => res.json({ ok:true, message:"National Land System API is running" }));

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("*", (req,res) => res.sendFile(path.join(__dirname, "..", "frontend", "index.html")));

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });