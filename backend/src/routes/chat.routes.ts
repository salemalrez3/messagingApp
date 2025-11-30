import { Router } from "express";
import { addChat, getChats } from "../controllers/chat.controller";

const router =Router();

router.get('/',getChats);
router.post('/',addChat);

export default router;