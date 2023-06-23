const mongoose=require("mongoose");
const bcrypt=require("bcryptjs")

const userSchema= mongoose.Schema({
      name:{
        type:String,
        required: [true,"Please add a name"],
      },
      email:{
        type:String,
        required:[true,"Please add a email"],
        unique:true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,"Please enter a valid email"
        ]
      },
      password:{
        type:String,
        required: [true,"Please add a password"],
        minLength: [6,"Password must be up to 6 characters"],
       // maxLength: [33,"Paswsword must not be more than 33 characters"],
      },
      photo: {
        type : String,
        required: [true, "Please add a photo"],
        default: "https://www.google.com/imgres?imgurl=https%3A%2F%2Fcloudfront-us-east-1.images.arcpublishing.com%2Fadvancelocal%2FSJGKVE5UNVESVCW7BBOHKQCZVE.jpg&tbnid=-IR6wlyJtjtp9M&vet=12ahUKEwi7p5v6rrH_AhWzM7cAHaUlCeEQMygTegUIARD2AQ..i&imgrefurl=https%3A%2F%2Fwww.nj.com%2Fentertainment%2F2020%2F05%2Feveryones-posting-their-facebook-avatar-how-to-make-yours-even-if-it-looks-nothing-like-you.html&docid=5Log_sOiACoGzM&w=804&h=554&q=avatar%20maker%20link&hl=en&ved=2ahUKEwi7p5v6rrH_AhWzM7cAHaUlCeEQMygTegUIARD2AQ"
      },
      phone:{
        type:String,
        required:[true,"Please add a phone number"],
        default:+91
      },
      bio:{
        type:String,
        maxLength: [250, "Bio must not be more than 250 characters"],
        default:"bio"
      }
},{
    timestamps:true
})

//Encrypt password before saving to DB

userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        return next();
    }
    //Hash Password
    const salt=await bcrypt.genSalt(13);
    const hashedPassword=await bcrypt.hash(this.password,salt);
    this.password=hashedPassword
    return next()
})

const User=mongoose.model("User",userSchema)
module.exports=User