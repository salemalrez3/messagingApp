import { Request, Response } from "express";
import prisma from "../db";

import { io } from "..";

/**
 * @swagger
 * /msgs:
 *   get:
 *     summary: Get messages of a chat (paginated)
 *     description: Returns the latest messages in a chat using cursor-based pagination.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatId
 *         required: true
 *         description: Chat ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: Number of messages to fetch (default 20)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cursor
 *         description: Message ID to continue pagination from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       400:
 *         description: Missing chatId
 *       500:
 *         description: Server error
 */
export const getMsgs = async (req: Request, res: Response) => {
  try {
    const chatId = String(req.query.chatId);
    const take = Number(req.query.limit) || 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasNext = messages.length > take;
    if (hasNext) messages.pop();

    const nextCursor = hasNext ? messages[messages.length - 1].id : null;

    res.json({
      messages,
      nextCursor,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /msgs:
 *   post:
 *     summary: Send a message to a chat
 *     description: Creates a message for the authenticated user.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatId
 *         required: true
 *         description: Chat ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Hello world"
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Missing chatId or text
 *       403:
 *         description: User is not part of this chat
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
export const sendMsg = async (req: Request, res: Response) => {
  try {
    const chatId = String(req.query.chatId);
    const msgTxt = String(req.body.text || "").trimEnd();
    const senderId =(req as any).user.id;

    if (!chatId || !msgTxt) {
      return res.status(400).json({ error: "chatId and text are required" });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, participants: { select: { id: true } } },
    });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const userInChat = chat.participants.some((p) => p.id === senderId);
    if (!userInChat) {
      return res.status(403).json({ error: "Not part of this chat" });
    }

    const msg = await prisma.message.create({
      data: { chatId, content: msgTxt, senderId },
    });

    await prisma.chatReadStatus.upsert({
      where: { chatId_userId: { chatId, userId: senderId } },
      create: { chatId, userId: senderId, lastSeenMessageId: msg.id },
      update: { lastSeenMessageId: msg.id },
    });
    
  io.to(`chat:${chatId}`).emit("msg:new", msg);
    res.status(201).json({ msg });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

