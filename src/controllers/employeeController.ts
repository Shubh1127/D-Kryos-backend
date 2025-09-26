import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { Employee, generateEmployeeHash } from "../models/employeeModel";
import { uploadFile } from "../services/awsService";
import { KryosService } from "../services/kryosService";

// Kryos SDK client (for user data hashes)
const kryos = new KryosService(process.env.KRYOS_API_KEY || "demo-api-key");

// ----------------- In-Memory Employee Storage -----------------
const employees: Employee[] = [];

// ----------------- Helper Functions -----------------
async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// ----------------- Controller Functions -----------------

// Register new user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (employees.find(e => e.email === email)) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await hashPassword(password);

        const newEmp: Employee = {
            id: crypto.randomUUID(),
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        employees.push(newEmp);

        // Generate hash for Kryos
        const empHash = generateEmployeeHash(newEmp);
        await kryos.sendHash(empHash, newEmp.id);

        res.status(201).json({ message: "User registered", employee: { ...newEmp, password: undefined } });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = employees.find(e => e.email === email);
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) return res.status(400).json({ message: "Invalid email or password" });

        const sessionToken = crypto.randomBytes(16).toString("hex");
        (user as any).sessionToken = sessionToken;

        res.json({ message: "Login successful", token: sessionToken });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// Edit user details
export const editUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const user = employees.find(e => e.id === id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const lastUpdated = new Date(user.updatedAt || user.createdAt);
        const now = new Date();
        if ((now.getTime() - lastUpdated.getTime()) < 24 * 60 * 60 * 1000) {
            return res.status(400).json({ message: "You can update only once per day" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = await hashPassword(password);

        user.updatedAt = now.toISOString();

        // Send updated hash to Kryos
        const empHash = generateEmployeeHash(user);
        await kryos.sendHash(empHash, user.id);

        res.json({ message: "User updated", employee: { ...user, password: undefined } });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// Upload media
export const uploadMedia = async (req: Request, res: Response) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send("No files uploaded.");
        }

        const files = (req.files as any).files; // express-fileupload
        const uploadedFiles: string[] = [];

        for (const file of Array.isArray(files) ? files : [files]) {
            // Upload via AWS service, sends hash automatically
            const fileUrl = await uploadFile(file.data, file.name, req.body.userId);
            uploadedFiles.push(fileUrl);
        }

        res.json({ message: "Files uploaded", files: uploadedFiles });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// Download media
export const downloadMedia = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const fileStream = await import("../services/awsService").then(m => m.downloadFile(key));
        fileStream.pipe(res);
    } catch (err) {
        res.status(500).json({ message: err });
    }
};

// Logout
export const logoutUser = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const user = employees.find(e => (e as any).sessionToken === token);
        if (!user) return res.status(400).json({ message: "Invalid token" });

        delete (user as any).sessionToken;
        res.json({ message: "Logout successful" });
    } catch (err) {
        res.status(500).json({ message: err });
    }
};
