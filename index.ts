import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import etfRoutes from "./routes/etfRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI as string, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/etfs", etfRoutes);

app.get("/", (req, res) => {
  res.send("This is a i-NAV api!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
