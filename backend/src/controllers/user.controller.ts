import { Request, Response } from "express";
import prisma from "../db";
import bcrypt from "bcryptjs";
import { transporter } from "../config/email";
import jwt from "jsonwebtoken";

// ---------- OTP GENERATOR ----------
/**
 * @swagger
 * components:
 *   schemas:
 *     OTP:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         code:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         username:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         username:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error message description"
 *         details:
 *           type: string
 *           example: "Detailed error information"
 */
function createToken(id: string, email: string) {
  return jwt.sign(
    { id, email },
    String(process.env.JWT_SECRET),
    { expiresIn: "7d" }
  );
}

// ---------- REGISTER ----------
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account with email, password, phone, and username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - phone
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securepassword123"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: "john_doe"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: Request, res: Response) => {
  try {
    const password = String(req.body.password);
    const phone = String(req.body.phone);
    const email = String(req.body.email);
    const username = String(req.body.username);

    if (!password || !phone || !username || !email) {
      return res.status(400).json({ error: "Missing data" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { password: hashed, phone, username, email },
    });

    res.status(201).json({ user });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

// ---------- REQUEST OTP ----------
/**
 * @swagger
 * /requestOtp:
 *   post:
 *     summary: Request OTP for login
 *     tags: [Authentication]
 *     description: Send a one-time password to the user's email for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "OTP sent to your email"
 *       400:
 *         description: Bad request - Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const requestOtp = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email);
    const password = String(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // 1) Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2) Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    // 3) Generate OTP
    const code = generateOtp();

    // 4) Save OTP row in DB (delete previous)
    await prisma.oTP.deleteMany({ where: { email } });

    await prisma.oTP.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // // 5) Send the email
    // await transporter.sendMail({
    //   from: `"My App" <${process.env.EMAIL_USER}>`,
    //   to: email,
    //   subject: "Your Login Code",
    //   text: `Your login code is ${code}. It expires in 5 minutes.`,
    // });

    res.status(200).json({ msg: "OTP sent to your email",debugOtp:code });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

// ---------- VERIFY OTP ----------
/**
 * @swagger
 * /verifyOtp:
 *   post:
 *     summary: Verify OTP and login
 *     tags: [Authentication]
 *     description: Verify the one-time password and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "OTP verified."
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Bad request - Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email);
    const otp = String(req.body.otp);

    if (!email || !otp) {
      return res.status(400).json({ error: "Missing email or otp" });
    }

    // 1) Find matching OTP
    const record = await prisma.oTP.findFirst({
      where: { email, code: otp },
    });

    if (!record) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // 2) Check expiry
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // 3) Delete OTP so it can't be reused
    await prisma.oTP.delete({ where: { id: record.id } });
     const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4) Create JWT
    const token = createToken(
       user.id,
      user.email,
    );

    // 5) Send token to frontend
    return res.status(200).json({
      msg: "OTP verified.",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};