const dotenv=require("dotenv").config();
const express=require("express");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const cors=require("cors");
const userRoute= require("./routes/userRoutes")
const productRoute=require("./routes/productRoutes")
const errorHandler=require("./middleware/errorMiddleware")
const app=express();
const cookieParser=require("cookie-parser")
const path=require("path")
const contactRoute=require("./routes/contactRoute")

// MIddlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors({
    origin:["http://localhost:3000","https://BLW-InventoryApp.vercel.app"],
    credentials:true
}));
app.use("/uploads",express.static(path.join(__dirname,"uploads")))

//Routes Middlewares
app.use("/api/users",userRoute)
app.use("/api/products",productRoute)
app.use("/api/contactus",contactRoute)

// Routes
app.get("/",(req,res)=>{
    res.send("Home Page")
})

//Error Handler
app.use(errorHandler)

const PORT= process.env.PORT || 5000;

// Connect to DB and start server

mongoose.connect(process.env.MONGO_URI).then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server Running on port ${PORT}`)
    })
})
.catch((err)=>console.log(err))

