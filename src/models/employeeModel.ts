import bcrypt from "bcrypt";
import crypto from "crypto";    
export interface Employee {
    id: string;           // Unique employee ID (UUID)
    name: string;
    email: string;
    password: string;     // Store hashed password only (never plain text!)
    role: string;         // e.g., Admin, Manager, Employee
    createdAt: string;    // ISO timestamp
    updatedAt?: string;   // ISO timestamp
}

export function createEmployee(name: string, email: string, role: string): Employee {
    return {
        id: crypto.randomUUID(),          // Node 18+ has crypto.randomUUID()
        name,
        email,
        role,
        createdAt: new Date().toISOString()
    };
}

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export function generateEmployeeHash(emp: Employee): string {
    const dataStr = `${emp.id}-${emp.name}-${emp.email}-${emp.role}-${emp.createdAt}`;
    return crypto.createHash("sha256").update(dataStr).digest("hex");
}