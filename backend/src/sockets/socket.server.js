const { Server } = require("socket.io");
const {parseCookie} = require('cookie');
const userModel = require("../models/user.model");
const jwt = require('jsonwebtoken')
const aiService = require('../service/ai.service')
const messageModel = require('../models/message.model')
const {createMemory,queryMemory} = require('../service/vector.service');
const allowedOrigins = require('../config/allowed-origins')
// const { Promise } = require("mongoose");

function initSocketServer(httpServer){
    const io = new Server(httpServer,{
        cors: {
            origin : allowedOrigins,
            allowedHeaders: ["Content-Type","Authorization"],
            credentials: true
        }
    })

    io.use( async (socket,next)=>{  // socketio middleware

        const cookies = parseCookie(socket.handshake.headers?.cookie || "")

        if(!cookies.token){
            return next(new Error("Authentication error: No token provided"))
        }
        // console.log(cookies.token)

        try{

            const decoded = jwt.verify(cookies.token,process.env.JWT_SECRET)

            // console.log(decoded)

            const user = await userModel.findById(decoded.id)

            socket.user = user

            next()

        }catch(err){
            next(new Error("Authentication error: Invalid token"))
        }

    })

    io.on("connection",(socket)=>{
        /* console.log("User connected: ",socket.user)
        console.log("New socket connection: ",socket.id) */
        // console.log("user connected")


        socket.on("ai-message", async (messagePayload)=>{


            /* messagePayload = {chat: chatId,content: message text content} */

            // console.log(messagePayload)

            const [message,vectors] = await Promise.all([
                messageModel.create({
                    chat: messagePayload.chat,
                    user:socket.user._id,
                    content: messagePayload.content,
                    role: "user"
                }),
                aiService.generateVector(messagePayload.content)

            ])

            await createMemory({
                vectors,
                messageId: message._id,
                metadata: {
                    chat: messagePayload.chat,
                    user: socket.user._id,
                    text: messagePayload.content
                }
            })

            // console.log("Generated Vectors", vectors)


            const [memory,chatHistory] = await Promise.all([
                queryMemory({
                    queryVector: vectors,
                    limit: 3,
                    metadata: {
                        user: socket.user._id.toString()
                    }
                }),
                messageModel.find({
                    chat: messagePayload.chat
                })/* .sort({createdAt:-1}).limit(20).lean().reverse() */
            ])


            const ltm = memory.map(item => item.metadata.text).join("\n");

            const stm = chatHistory.map(item => `${item.role}: ${item.content}`).join("\n");

            const prompt = `You are an AI assistant.

                            Here are some relevant previous messages from memory:
                            ${ltm}

                            Here is the recent conversation:
                            ${stm}

                            Use the previous conversation and memory to answer the user's latest message.

                            Give a natural and helpful response.
                            `;

            // console.log(ltm[0])
            // console.log(stm)

            try {

                const response = await aiService.generateResponse(prompt)

                socket.emit("ai-response", {
                    content: response,
                    chat: messagePayload.chat
                })

                const [responseMessage,responseVectors] = await Promise.all([
                    
                    messageModel.create({
                        chat: messagePayload.chat,
                        user:socket.user._id,
                        content: response,
                        role: "model"
                    }),
            
                    aiService.generateVector(response)
                    
                ])

                await createMemory({
                    vectors: responseVectors,
                    messageId: responseMessage._id,
                    metadata: {
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        text: response
                    }
                })

            } catch (error) {

                console.error("AI ERROR:");
                console.error(error);

                socket.emit("ai-error", {
                message: error.message
                });
            }    

            
            
        })

    })

    
}

module.exports = initSocketServer