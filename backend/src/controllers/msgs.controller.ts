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
      include: {
    replyToMessage: true, 
  },
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

/**
 * @swagger
 * /msgs/{id}/delivered:
 *   post:
 *     summary: Mark a message as delivered
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Message ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as delivered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Message delivered"
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
export const markMsgDelivered = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const msgId = req.params.id;

    const msg = await prisma.message.findUnique({ where: { id: msgId } });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    await prisma.messageDelivery.upsert({
      where: { messageId_userId: { messageId: msgId, userId } },
      create: { messageId: msgId, userId, deliveredAt: new Date() },
      update: { deliveredAt: new Date() },
    });

    io.to(`chat:${msg.chatId}`).emit("msg:delivered", {
      messageId: msgId,
      userId,
    });

    res.status(200).json({ msg: "Message delivered" });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /msgs/{id}:
 *   patch:
 *     summary: Edit a message
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Message ID
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
 *                 example: "Edited message text"
 *     responses:
 *       200:
 *         description: Message edited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not sender
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
export const editMsg = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const msgId = req.params.id;
    const newText = String(req.body.text || "").trim();

    if (!newText) return res.status(400).json({ error: "Text is required" });

    const msg = await prisma.message.findUnique({ where: { id: msgId } });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (msg.senderId !== userId) return res.status(403).json({ error: "Not sender" });

    const updatedMsg = await prisma.message.update({
      where: { id: msgId },
      data: { content: newText, editedAt: new Date() },
    });

    // Broadcast via socket
    io.to(`chat:${msg.chatId}`).emit("msg:edited", updatedMsg);

    res.status(200).json({ msg: updatedMsg });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /msgs/{id}:
 *   delete:
 *     summary: Soft delete a message
 *     description: Marks a message as deleted. Only the sender can delete it.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Message ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Message deleted"
 *       403:
 *         description: Not the sender
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const deleteMsg = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const msgId = String(req.params.id);

    const msg = await prisma.message.findUnique({ where: { id: msgId } });
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.senderId !== userId) return res.status(403).json({ error: "Not the sender" });

    const deletedMsg = await prisma.message.update({
      where: { id: msgId },
      data: { isDeleted: true, deletedAt: new Date(), content: "Message deleted" },
    });

    if (io) io.to(`chat:${msg.chatId}`).emit("msg:deleted", { id: msgId });

    return res.status(200).json({ msg: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /msgs/reply:
 *   post:
 *     summary: Reply to a message
 *     description: Sends a message that is a reply to an existing message.
 *     tags: [Messages]
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
 *             required:
 *               - text
 *               - replyToMessageId
 *             properties:
 *               text:
 *                 type: string
 *                 example: "I agree!"
 *               replyToMessageId:
 *                 type: string
 *                 description: ID of the message being replied to
 *                 example: "uuid-of-original-message"
 *     responses:
 *       201:
 *         description: Reply sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat or original message not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: User not part of chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const replyMsg = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const chatId = String(req.query.chatId);
    const { text, replyToMessageId } = req.body;

    if (!chatId || !text || !replyToMessageId) {
      return res.status(400).json({ error: "chatId, text, and replyToMessageId are required" });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: { select: { id: true } } },
    });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const userInChat = chat.participants.some((p) => p.id === userId);
    if (!userInChat) return res.status(403).json({ error: "Not part of this chat" });

    const originalMsg = await prisma.message.findUnique({ where: { id: replyToMessageId } });
    if (!originalMsg) return res.status(404).json({ error: "Original message not found" });

    const msg = await prisma.message.create({
      data: { chatId, senderId: userId, content: text, replyToMessageId, },
    });

    if (io) io.to(`chat:${chatId}`).emit("msg:new", msg);

    return res.status(201).json({ msg});
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};

