const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const chatController = require('../controller/chat.controller')

const router = express.Router()

/* post /api/chat/ */
router.post('/',authMiddleware.authUser,chatController.createChat)
router.get('/',authMiddleware.authUser,chatController.getChats)
router.get('/:chatId/messages', authMiddleware.authUser, chatController.getChatMessages)


module.exports = router