const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createChatSession,
  listChatSessions,
  getChatSession,
  sendMessage,
} = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.post('/', createChatSession);
router.get('/', listChatSessions);
router.get('/:id', getChatSession);
router.post('/:id/message', sendMessage);

module.exports = router;
