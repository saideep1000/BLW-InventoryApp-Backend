const asyncHandler = require("express-async-handler");
//async hanler is used to get rid of neccessary condition of writing try catch block in async function
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail=require("../utils/sendEmail")

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User function

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be upto 6 characters");
  }
  //Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has Already been registered");
  }

  //Encrypt password before saving to db
  // const salt=await bcrypt.genSalt(13)
  // const hashedPassword=await bcrypt.hash(password,salt)

  //Create new user
  const user = await User.create({
    name,
    email,
    password, //: hashedPassword
  });

  //Generate token
  const token = generateToken(user._id);

  //Send HTTP-only cookies
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid User Data");
  }
});

//Login User Function
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  //Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  //User exist,check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //     generate Token
  //     const token=generateToken(user._id);
  //    Send HTTP-Only cookie
  //    res.cookie("token",token,{
  //     path:"/",
  //     httpOnly:true,
  //     expires: new Date(Date.now()+1000*86400),//1day
  //     sameSite:"none",
  //     secure:true,
  //    })

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;

    //generating the auth token for valid user

    const token = generateToken(user._id);

    //Cookis to be sent before status
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1day
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid Username or Password");
  }
});

//Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged out" });
});

//GetUser Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

//Get login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  //Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

//Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updateUser = await user.save();
    res.status(200).json({
      name: updateUser.name,
      email: updateUser.email,
      phone: updateUser.phone,
      photo: updateUser.photo,
      bio: updateUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//Change Password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found,please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Plesae add old and new password");
  }
  //check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successfully");
  } else {
    res.status(400);
    throw new Error("Old Password is incorrect");
  }
});

//Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  //Delete token if it exists in DB
  let token=await Token.findOne({userId: user._id})
 if(token)
 {
    await Token.deleteOne(token)
 } 
  // Create reset Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken)
  //Hash token before saving to db
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // console.log(hashedToken)
  //Save Token to db
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiredAt: Date.now() + 1000 * 30 * 60, //30 mins
  }).save();

  //Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  //Reset Email
  const message = `<h2>Hello ${user.name}</h2><p>Please use the url below to reset your password</p><p>This reset link is valid for only 30 minutes.</p>  <a href=${resetUrl} clicktracking=off>${resetUrl}</a>   <p>Regards...</p><p>BLW</p>`;
 const subject="Password reset Request"
 const send_to=user.email
 const sent_from=process.env.EMAIL_USER

 try{
    await sendEmail(subject,message,send_to,sent_from)
    res.status(200).json({success:true,message: "Reset Email sent"})
 }catch(error){
       res.status(500)
       throw new Error("Email nt sent, please try again")
 }
  res.send("Forgot password");
});

//Reset Password

const resetPassword=asyncHandler(async (req,res)=>{
  
   const {password} = req.body;
   const {resetToken}=req.params;
   //Hash token,then compare to Token in DB
   const hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex");

   //find Token in DB
   const userToken= await Token.findOne(
    {
      token: hashedToken,
      expiredAt: {$gt : Date.now()}
    }
   )
   if(!userToken){
    res.status(404);
    throw new Error("Invalid or Expired Token")
   }
   //Find User
   const user=await User.findOne({_id:userToken.userId})
   user.password=password
   await user.save()

   res.status(200).json({
    message:"Password, Reset Successful, Please login"
   })
})

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword
};
