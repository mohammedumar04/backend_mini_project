const mongoose = require('mongoose')
const chatModel = require('../models/chat.model')
const messageModel = require('../models/message.model')

async function createChat(req,res){
    const {title} = req.body
    const user = req.user

    const chat = await chatModel.create({
        user: user._id,
        title
    })

    res.status(201).json({
        message:"Chat created successfully",
        chat: {
            _id: chat._id,
            title: chat.title,
            lastActivity: chat.lastActivity,
            user: chat.user
        }
    })
}

async function getChats(req,res){
    const chats = await chatModel.find({user: req.user._id})
        .sort({lastActivity: -1, createdAt: -1})
        .select('_id title lastActivity')

    res.status(200).json({chats})
}

async function getChatMessages(req, res) {
    const { chatId } = req.params

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: 'Invalid chat ID' })
    }

    const chat = await chatModel.findOne({ _id: chatId, user: req.user._id })
        .select('_id')

    if (!chat) {
        return res.status(404).json({ message: 'Chat not found' })
    }

    const messages = await messageModel.find({ chat: chatId, user: req.user._id })
        .sort({ createdAt: 1, _id: 1 })
        .select('_id content role createdAt')

    res.status(200).json({ messages })
}

module.exports = {
    createChat,
    getChats,
    getChatMessages
}