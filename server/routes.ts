import type { Express } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { signToken, requireAuth } from "./auth";
import type { JWTPayload } from "./auth";
import { getUncachableResendClient } from "./resend-client";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ── Register ──────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { email, username, password } = req.body as Record<string, string>;

    if (!email || !username || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    const [existingEmail, existingUsername] = await Promise.all([
      storage.getUserByEmail(email),
      storage.getUserByUsername(username),
    ]);
    if (existingEmail) { res.status(409).json({ error: "Email already in use" }); return; }
    if (existingUsername) { res.status(409).json({ error: "Username already taken" }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await storage.createUser({ email, username, passwordHash });

    const token = signToken({ userId: user.id, email: user.email, username: user.username });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt } });
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { emailOrUsername, password } = req.body as Record<string, string>;
    if (!emailOrUsername || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const user = emailOrUsername.includes("@")
      ? await storage.getUserByEmail(emailOrUsername)
      : await storage.getUserByUsername(emailOrUsername);

    if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const token = signToken({ userId: user.id, email: user.email, username: user.username });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt } });
  });

  // ── Me ────────────────────────────────────────────────────────────────────
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const { userId } = (req as any).user as JWTPayload;
    const user = await storage.getUserById(userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ id: user.id, email: user.email, username: user.username, createdAt: user.createdAt });
  });

  // ── Forgot Password ───────────────────────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body as Record<string, string>;
    if (!email) { res.status(400).json({ error: "Email is required" }); return; }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      res.json({ success: true });
      return;
    }

    const otp = generateOTP();
    await storage.createResetToken(email, otp);

    let emailSent = false;
    try {
      const { client, fromEmail } = await getUncachableResendClient();
      await client.emails.send({
        from: fromEmail,
        to: email,
        subject: "LeadLocker — Şifre Sıfırlama Kodu",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px">
            <h2 style="color:#2D6BE4;margin-bottom:8px">LeadLocker</h2>
            <p style="color:#334155">Şifre sıfırlama kodunuz:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1e293b;background:#e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:20px 0">${otp}</div>
            <p style="color:#64748b;font-size:13px">Bu kod 10 dakika geçerlidir. Şifre sıfırlamayı talep etmediyseniz bu e-postayı görmezden gelin.</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (err) {
      console.error("Email send error:", err);
    }

    if (!emailSent) {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, devOtp: emailSent ? undefined : otp });
  });

  // ── Verify OTP + Reset Password ───────────────────────────────────────────
  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body as Record<string, string>;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const token = await storage.getResetToken(email);
    if (!token || token.otp !== otp || Date.now() > token.expiresAt) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUserPassword(token.userId, passwordHash);
    await storage.deleteResetToken(email);

    res.json({ success: true });
  });

  // ── Delete Account ────────────────────────────────────────────────────────
  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    const { userId } = (req as any).user as JWTPayload;
    await storage.deleteUser(userId);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
