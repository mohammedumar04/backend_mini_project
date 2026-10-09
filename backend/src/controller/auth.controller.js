const userModel = require('../models/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER_EXTERNAL_URL)
const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
}


async function registerUser(req,res){

    const {fullName/* :{firstName,lastName} */,email,password} = req.body

    const isUserAlreadyExists = await userModel.findOne({email})

    if(isUserAlreadyExists){
        return res.status(400).json({
            message: "User already exists"
        })
    }

    const hashPassword = await bcrypt.hash(password,10)

    const user = await userModel.create({
        fullName: {
            firstName: fullName.firstName,
            lastName: fullName.lastName
        },
        email,
        password: hashPassword
    })

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("token",token,authCookieOptions)

    res.status(201).json({
        message: "User registered successfully",
        _id: user._id,
        fullName: user.fullName
    })
}

async function loginUser(req,res){

    const {email,password} = req.body

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid password"
        })
    }

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

    res.cookie("token",token,authCookieOptions)

    res.status(200).json(({
        message: "User login successfully"
    }))

}

module.exports = {
    registerUser,
    loginUser
}