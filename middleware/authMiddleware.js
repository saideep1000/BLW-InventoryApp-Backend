const asyncHandler=require("express-async-handler")
//async hanler is used to get rid of neccessary condition of writing try catch block in async function
const User=require("../models/userModel")
//const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")

const protect=asyncHandler(async (req,res,next)=>{
    
    try{
        const token=req.cookies.token
        // console.log(token)
        if(!token)
        {
            res.status(401)
            throw new Error("Not authorised,please login")
        }
        //Verify token
        const verified=jwt.verify(token,process.env.JWT_SECRET)
        //Get user id from token
        const user=await User.findById(verified.id).select("-password")
        if(!user)
        {
            res.status(401)
            throw new Error("User not Found")
        }
        req.user=user
        next();
        
    }catch(error){
        res.status(401)
        throw new Error("Not authorised,please login")
    }

})

module.exports={protect};