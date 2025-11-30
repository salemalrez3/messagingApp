import { Router } from "express";
import { forgotPassword, register, requestOtp, resetPassword, verifyOtp } from "../controllers/user.controller";

const router = Router();

router.post("/register",register );
router.post("/requestOtp", requestOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);

export default router;  