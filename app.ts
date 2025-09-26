import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import employeeRoutes from "./routes/employeeRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/employees", employeeRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Demo backend running on port ${PORT}`);
});
