import express from "express";
import { handleWixWebhook } from "../controllers/hubspotController.js";

const router = express.Router();

router.post("/", handleWixWebhook);

export default router;