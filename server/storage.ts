import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: number;
}

export interface ResetToken {
  userId: string;
  email: string;
  otp: string;
  expiresAt: number;
}

export interface IStorage {
  getUserById(id: string): Promise<AuthUser | undefined>;
  getUserByEmail(email: string): Promise<AuthUser | undefined>;
  getUserByUsername(username: string): Promise<AuthUser | undefined>;
  createUser(data: { email: string; username: string; passwordHash: string }): Promise<AuthUser>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  createResetToken(email: string, otp: string): Promise<void>;
  getResetToken(email: string): Promise<ResetToken | undefined>;
  deleteResetToken(email: string): Promise<void>;
}

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], resetTokens: [] }));
}

function readData(): { users: AuthUser[]; resetTokens: ResetToken[] } {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { users: [], resetTokens: [] };
  }
}

function writeData(data: { users: AuthUser[]; resetTokens: ResetToken[] }) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export class FileStorage implements IStorage {
  async getUserById(id: string): Promise<AuthUser | undefined> {
    return readData().users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string): Promise<AuthUser | undefined> {
    return readData().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByUsername(username: string): Promise<AuthUser | undefined> {
    return readData().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async createUser(data: { email: string; username: string; passwordHash: string }): Promise<AuthUser> {
    const db = readData();
    const user: AuthUser = { id: randomUUID(), ...data, createdAt: Date.now() };
    db.users.push(user);
    writeData(db);
    return user;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    const db = readData();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx !== -1) db.users[idx].passwordHash = passwordHash;
    writeData(db);
  }

  async deleteUser(id: string): Promise<void> {
    const db = readData();
    db.users = db.users.filter((u) => u.id !== id);
    writeData(db);
  }

  async createResetToken(email: string, otp: string): Promise<void> {
    const db = readData();
    db.resetTokens = db.resetTokens.filter((t) => t.email !== email);
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;
    db.resetTokens.push({ userId: user.id, email: email.toLowerCase(), otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    writeData(db);
  }

  async getResetToken(email: string): Promise<ResetToken | undefined> {
    return readData().resetTokens.find((t) => t.email === email.toLowerCase());
  }

  async deleteResetToken(email: string): Promise<void> {
    const db = readData();
    db.resetTokens = db.resetTokens.filter((t) => t.email !== email.toLowerCase());
    writeData(db);
  }
}

export const storage = new FileStorage();
