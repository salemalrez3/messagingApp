import { Router } from "express";
import { addChat, getChats, markChatSeen } from "../controllers/chat.controller";

const router =Router();

router.get('/',getChats);
router.post('/',addChat);
router.post("/chats/:chatId/seen",markChatSeen);
export default router;