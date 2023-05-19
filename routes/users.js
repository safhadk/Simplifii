import express from "express";
import { OTP,login} from "../controller/user.js";

const router = express.Router();

router.post('/otp',OTP)
router.post('/login',login)

export default router;
