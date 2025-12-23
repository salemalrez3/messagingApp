import { Router } from "express";
import { deleteMsg, editMsg, getMsgs, markMsgDelivered, replyMsg, sendMsg } from "../controllers/msgs.controller";

const router = Router();

router.get("/", getMsgs);
router.post("/", sendMsg);
router.post("/msgs/:id/delivered", markMsgDelivered);
router.patch("/msgs/:id",editMsg);
router.post("/reply",replyMsg);     
router.delete("/:id",deleteMsg);
export default router;  