import { Router } from "express";
import fileUpload from "express-fileupload";
import {
    registerUser,
    loginUser,
    editUser,
    uploadMedia,
    downloadMedia,
    logoutUser
} from "../controllers/employeeController";

const router = Router();

// Enable file upload
router.use(fileUpload());

// Routes
router.post("/register", registerUser);            // Register user
router.post("/login", loginUser);                  // Login
router.put("/edit/:id", editUser);                // Edit user details
router.post("/upload", uploadMedia);              // Upload media
router.get("/download/:key", downloadMedia);      // Download media by S3 key
router.post("/logout", logoutUser);               // Logout

export default router;
