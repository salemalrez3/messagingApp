import { Request, Response } from "express";
import prisma from "../db";
import bcrypt from "bcryptjs";
import { transporter } from "../config/email";
import jwt from "jsonwebtoken";
import { error } from "node:console";
const JWT_SECRET = String(process.env.JWT_SECRET);

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
 *         phone:
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

export function createToken(userId: string, email?: string, tokenVersion = 0) {
  return jwt.sign({ userId, email, tokenVersion }, JWT_SECRET, { expiresIn: "7d" });
}

// ---------- REGISTER ----------
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user - Step 1
 *     tags: [Authentication]
 *     description: Start registration by sending OTP to email
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
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to email"
 *                 debug_otp:
 *                   type: string
 *                   description: "Only in development"
 *                   example: "123456"
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
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
    const email = String(req.body.email).toLowerCase().trim();
    const password = String(req.body.password);
    const username = String(req.body.username).trim();
    const phone = String(req.body.phone).trim();

    if (!password || !username || !email ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email, username or phone already exists" });
    }

    const otp = generateOtp();
    
    await prisma.oTP.deleteMany({where:{email}});
    await prisma.oTP.create({
      data:{
        code:otp,
        email,
        expiresAt:new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    res.status(201).json({ 
      message: "OTP sent to email. Use /verify-register endpoint with OTP to complete registration.",
      debug_otp: otp 
    });

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

// ---------- VERIFY REGISTRATION ----------
/**
 * @swagger
 * /verify-register:
 *   post:
 *     summary: Verify registration - Step 2
 *     tags: [Authentication]
 *     description: Complete registration by verifying OTP and creating user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - otp
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
 *                 example: "securepassword123"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid or expired OTP
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
export const verifyRegister = async (req:Request,res:Response)=>{
  try {
    const password = String(req.body.password);
    const email = String(req.body.email).toLowerCase().trim();
    const otp = String(req.body.otp);
    const phone = String(req.body.phone).trim();
    const username = String(req.body.username).trim();

    if(!password || !email || !otp ||  !username){
      return res.status(400).json({error:"All fields are required: email, password, otp, username"});
    }

    // Check if user already exists (double-check)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email, username or phone already exists" });
    }

    // Find OTP and check expiration
    const valid = await prisma.oTP.findFirst({
      where: {
        email,
        code: otp,
        expiresAt: {
          gt: new Date() 
        }
      }
    });
    
    if (!valid){
      return res.status(401).json({error:"Invalid or expired OTP"});
    }

    if (valid.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { id: valid.id } });
      return res.status(401).json({error:"OTP has expired"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        username
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        createdAt: true
      }
    });
    
    const token = createToken(user.id, email);
    await prisma.oTP.delete({ where: { id: valid.id } });
    
    res.status(201).json({
      token,
      user,
      message: "User created successfully"
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: "User with this email, username or phone already exists" 
      });
    }
    
    res.status(500).json({ error: "Server error", details: error.message });
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    const code = generateOtp();

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

    const record = await prisma.oTP.findFirst({
      where: { 
        email, 
        code: otp,
        expiresAt: {
          gt: new Date() 
        }
      },
    });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (record.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { id: record.id } });
      return res.status(400).json({ error: "OTP expired" });
    }

    await prisma.oTP.delete({ where: { id: record.id } });
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = createToken(user.id, user.email);

    return res.status(200).json({
      msg: "OTP verified.",
      token,
      user
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /resetPassword:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Authentication]
 *     description: Validates OTP and allows the user to set a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email);
    const otp = String(req.body.otp);
    const newPassword = String(req.body.newPassword);

    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: "Missing data" });

    const record = await prisma.oTP.findFirst({ 
      where: { 
        email, 
        code: otp,
        expiresAt: {
          gt: new Date() 
        }
      } 
    });

    if (!record)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    if (record.expiresAt < new Date())
      return res.status(400).json({ error: "OTP expired" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ error: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    await prisma.oTP.delete({ where: { id: record.id } });

    return res.status(200).json({ msg: "Password reset successful." });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};


/**
 * @swagger
 * /forgotPassword:
 *   post:
 *     summary: Send OTP to user's email for password reset
 *     tags: [Authentication]
 *     description: Sends a 6-digit OTP to the user's email so they can reset their password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "OTP sent to your email"
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();

    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const code = generateOtp();

    await prisma.oTP.deleteMany({ where: { email } });

    await prisma.oTP.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // In production: send email
    // await transporter.sendMail(...)

    return res.status(200).json({ msg: "OTP sent to your email", debugOtp: code });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};