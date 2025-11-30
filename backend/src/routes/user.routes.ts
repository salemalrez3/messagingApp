import { Router } from "express";
import { register, requestOtp, verifyOtp } from "../controllers/user.controller";

const router = Router();

router.post("/register",register );
router.post("/requestOtp", requestOtp);
router.post("/verifyOtp", verifyOtp);

export default router;  