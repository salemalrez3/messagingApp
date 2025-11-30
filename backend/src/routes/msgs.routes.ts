import { Router } from "express";
import { getMsgs, sendMsg } from "../controllers/msgs.controller";

const router = Router();

router.get("/", getMsgs);
router.post("/", sendMsg);

export default router;  