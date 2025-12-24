// src/controllers/msgs.controller.ts
import { Request, Response } from "express";
import prisma from "../db";
import { io } from "..";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserShort:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         profilePic:
 *           type: string
 *
 *     MessageShort:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         senderId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isDeleted:
 *           type: boolean
 *
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         sender:
 *           $ref: '#/components/schemas/UserShort'
 *         senderId:
 *           type: string
 *         chatId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isDeleted:
 *           type: boolean
 *         replyToMessage:
 *           oneOf:
 *             - $ref: '#/components/schemas/MessageShort'
 *             - type: 'null'
 *
 *     GetMessagesResponse:
 *       type: object
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *         nextCursor:
 *           type: string
 *           nullable: true
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: string
 */

/**
 * @swagger
 * /msgs:
 *   get:
 *     summary: Get messages of a chat (paginated)
 *     description: Returns the latest messages in a chat using cursor-based pagination. Each message includes `sender` and optional `replyToMessage`.
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
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
 *         description: Message ID to continue pagination from (cursor-based)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetMessagesResponse'
 *       400:
 *         description: Missing chatId
 *       500:
 *         description: Server error
 */
export const getMsgs = async (req: Request, res: Response) => {
  try {
    const chatId = String(req.query.chatId || "");
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
        // include the user who sent the message
        sender: { select: { id: true, username: true, profilePic: true } },
        // include a short view of the replied-to message (if any)
        replyToMessage: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            editedAt: true,
            isDeleted: true,
          },
        },
      },
    });

    const hasNext = messages.length > take;
    if (hasNext) messages.pop();

    const nextCursor = hasNext ? messages[messages.length - 1].id : null;

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
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
 *       - BearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
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
    const chatId = String(req.query.chatId || "");
    const msgTxt = String(req.body.text || "").trim();
    const senderId = (req as any).user?.userId || (req as any).user?.id;

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

    const created = await prisma.message.create({
      data: { chatId, content: msgTxt, senderId },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        replyToMessage: { select: { id: true, content: true, senderId: true, createdAt: true, editedAt: true, isDeleted: true } },
      },
    });

    // update read status for sender (so their last seen moves forward)
    await prisma.chatReadStatus.upsert({
      where: { chatId_userId: { chatId, userId: senderId } },
      create: { chatId, userId: senderId, lastSeenMessageId: created.id },
      update: { lastSeenMessageId: created.id },
    });

    // notify via socket AFTER DB success
    if (io) io.to(`chat:${chatId}`).emit("message:new", created);

    return res.status(201).json({ message: created });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
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
 *       - BearerAuth: []
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
 *                 message:
 *                   type: string
 *                   example: "Message delivered"
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
export const markMsgDelivered = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const msgId = String(req.params.id || "");

    const message = await prisma.message.findUnique({ where: { id: msgId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    await prisma.messageDelivery.upsert({
      where: { messageId_userId: { messageId: msgId, userId } },
      create: { messageId: msgId, userId, deliveredAt: new Date() },
      update: { deliveredAt: new Date() },
    });

    if (io) io.to(`chat:${message.chatId}`).emit("message:delivered", { messageId: msgId, userId });

    return res.status(200).json({ message: "Message delivered" });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
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
 *       - BearerAuth: []
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
 *                 message:
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
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const msgId = String(req.params.id || "");
    const newText = String(req.body.text || "").trim();

    if (!newText) return res.status(400).json({ error: "Text is required" });

    const message = await prisma.message.findUnique({ where: { id: msgId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.senderId !== userId) return res.status(403).json({ error: "Not sender" });

    const updatedMsg = await prisma.message.update({
      where: { id: msgId },
      data: { content: newText, editedAt: new Date() },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        replyToMessage: { select: { id: true, content: true, senderId: true, createdAt: true, editedAt: true, isDeleted: true } },
      },
    });

    if (io) io.to(`chat:${message.chatId}`).emit("message:edited", updatedMsg);

    return res.status(200).json({ message: updatedMsg });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
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
 *       - BearerAuth: []
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
 *                 message:
 *                   type: string
 *                   example: "Message deleted"
 *       403:
 *         description: Not the sender
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
export const deleteMsg = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const msgId = String(req.params.id || "");

    const message = await prisma.message.findUnique({ where: { id: msgId } });
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId !== userId) return res.status(403).json({ error: "Not the sender" });

    const deletedMsg = await prisma.message.update({
      where: { id: msgId },
      data: { isDeleted: true, deletedAt: new Date(), content: "Message deleted" },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        replyToMessage: { select: { id: true, content: true, senderId: true, createdAt: true, editedAt: true, isDeleted: true } },
      },
    });

    if (io) io.to(`chat:${message.chatId}`).emit("message:deleted", { id: msgId });

    return res.status(200).json({ message: "Message deleted" });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
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
 *       - BearerAuth: []
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
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing parameters
 *       404:
 *         description: Chat or original message not found
 *       403:
 *         description: User not part of chat
 *       500:
 *         description: Server error
 */
export const replyMsg = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const chatId = String(req.query.chatId || "");
    const text = String(req.body.text || "").trim();
    const replyToMessageId = String(req.body.replyToMessageId || "");

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

    const created = await prisma.message.create({
      data: { chatId, senderId: userId, content: text, replyToMessageId },
      include: {
        sender: { select: { id: true, username: true, profilePic: true } },
        replyToMessage: { select: { id: true, content: true, senderId: true, createdAt: true, editedAt: true, isDeleted: true } },
      },
    });

    // notify via socket
    if (io) io.to(`chat:${chatId}`).emit("message:new", created);

    return res.status(201).json({ message: created });
  } catch (error: any) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
