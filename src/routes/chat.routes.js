const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth");

// Áp dụng middleware protect để bảo vệ tất cả các request gửi đến chatbot
router.post("/", protect, handleChat);

module.exports = router;
