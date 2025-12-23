import { Request, Response } from "express";
import prisma from "../db";
import { io } from "..";

type ReqWithUser = Request & { user?: { userId: string } };

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Get chats for the authenticated user
 *     description: Returns a list of chats the authenticated user participates in, ordered by updatedAt desc. Each chat includes participants, lastMessage (single object), and unreadCount for the current user.
 *     tags:
 *       - Chats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Optional limit for number of chats returned
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       isGroup: { type: boolean }
 *                       groupPic: { type: string }
 *                       participants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             username: { type: string }
 *                             profilePic: { type: string }
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id: { type: string }
 *                           content: { type: string }
 *                           createdAt: { type: string, format: date-time }
 *                           senderId: { type: string }
 *                           status: { type: string }
 *                       unreadCount: { type: integer }
 *                       updatedAt: { type: string, format: date-time }
 *       401:
 *         description: Unauthenticated
 *       500:
 *         description: Server error
 */
export const getChats = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    // Fetch chats with single last message and this user's readStatus (if any)
    const chats = await prisma.chat.findMany({
      where: {
        participants: { some: { id: userId } },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          select: { id: true, username: true, profilePic: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            status: true,
          },
        },
        readStatuses: { where: { userId } }, // will be [] or [row]
      },
    });
    // For each chat compute unreadCount (messages with id > lastSeenMessageId)
    const normalizedPromises = chats.map(async (c) => {
      const lastMessage =
        c.messages && c.messages.length ? c.messages[0] : null;
      const readStatus =
        c.readStatuses && c.readStatuses.length ? c.readStatuses[0] : null;
      let unreadCount = 0;
      if (lastMessage) {
        if (readStatus && readStatus.lastSeenMessageId) {
          // 1) fetch the createdAt of the lastSeen message (can't compare UUIDs)
          const lastSeenMsg = await prisma.message.findUnique({
            where: { id: readStatus.lastSeenMessageId },
            select: { createdAt: true },
          });

          if (lastSeenMsg && lastSeenMsg.createdAt) {
            // 2) count messages created after that timestamp
            unreadCount = await prisma.message.count({
              where: {
                chatId: c.id,
                createdAt: { gt: lastSeenMsg.createdAt },
              },
            });
          } else {
            // if the referenced message doesn't exist for some reason,
            // fall back to counting all messages (safe default)
            unreadCount = await prisma.message.count({
              where: { chatId: c.id },
            });
          }
        } else {
          // user never read anything -> all messages are unread
          unreadCount = await prisma.message.count({
            where: { chatId: c.id },
          });
        }
      } else {
        unreadCount = 0;
      }

      // Build normalized object
      return {
        id: c.id,
        name: c.name ?? null,
        isGroup: c.isGroup,
        groupPic: c.groupPic ?? null,
        participants: c.participants,
        lastMessage,
        unreadCount,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      };
    });

    const normalized = await Promise.all(normalizedPromises);

    return res.status(200).json({ chats: normalized });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create a chat (DM or group)
 *     description: Create a chat and connect participants. If creating a DM, include both user ids in participants.
 *     tags:
 *       - Chats
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user ids. Current user will be added if missing.
 *               groupPic:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chat created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthenticated
 *       500:
 *         description: Server error
 */
export const addChat = async (req: ReqWithUser, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthenticated" });

    const body = req.body || {};
    const participants = Array.isArray(body.participants)
      ? (body.participants as string[])
      : [];
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const groupPic =
      typeof body.groupPic === "string" ? body.groupPic.trim() : null;

    if (!participants.length) {
      return res.status(400).json({ error: "participants array is required" });
    }

    if (!participants.includes(userId)) participants.push(userId);

    const isGroup = participants.length > 2;

    // Create chat and connect participants
    const chat = await prisma.chat.create({
      data: {
        name: name ?? undefined,
        isGroup,
        groupPic: groupPic ?? undefined,
        participants: {
          connect: participants.map((id) => ({ id })),
        },
      },
      include: {
        participants: {
          select: { id: true, username: true, profilePic: true },
        },
      },
    });

    return res.status(201).json({ chat });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};

/**
 * @swagger
 * /chats/{chatId}/seen:
 *   post:
 *     summary: Mark messages in a chat as seen
 *     description: Marks all messages in the specified chat as seen by updating the user's lastSeenMessageId.
 *     tags:
 *       - Chats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         description: Chat ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as seen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatId:
 *                   type: string
 *                 lastSeenMessageId:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: User is not part of this chat
 *       404:
 *         description: Chat or messages not found
 *       500:
 *         description: Server error
 */
export const markChatSeen = async (req: Request, res: Response) => {
  try {
    const chatId = String(req.params.chatId);
    const userId = (req as any).user.id;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    // Ensure chat exists and user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { participants: { select: { id: true } } },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const isParticipant = chat.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: "Not part of this chat" });
    }

    // Get latest message
    const lastMessage = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!lastMessage) {
      return res.status(404).json({ error: "No messages in this chat" });
    }

    // Update read status
    await prisma.chatReadStatus.upsert({
      where: {
        chatId_userId: { chatId, userId },
      },
      create: {
        chatId,
        userId,
        lastSeenMessageId: lastMessage.id,
      },
      update: {
        lastSeenMessageId: lastMessage.id,
      },
    });

    // Notify other users in real-time
    io.to(`chat:${chatId}`).emit("msg:seen", {
      chatId,
      userId,
      lastSeenMessageId: lastMessage.id,
    });

    return res.status(200).json({
      chatId,
      lastSeenMessageId: lastMessage.id,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error });
  }
};
