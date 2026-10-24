import express from "express";
import { redirectUrl, shortenUrl } from "../controllers";

const router = express.Router();

router.post("/", shortenUrl);
router.get("/:id", redirectUrl);

export default router;
