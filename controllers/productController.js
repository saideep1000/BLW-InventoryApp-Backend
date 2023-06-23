const asyncHandler=require("express-async-handler");
const Product=require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary=require("cloudinary").v2


const createProduct=asyncHandler(async (req,res)=>{
    
    const {name,sku,category,quantity,price,description}=req.body;

    //Validation
    if(!name || !category || !quantity || !price || !description )
    {
        res.status(400)
        throw new Error("Please fill in all fields")

    }

    //Handle Image Upload
    let fileData={};
    if(req.file){
//Save image to cloudinary
        let uploadedFile;
       try{
        uploadedFile= await cloudinary.uploader.upload(req.file.path,{folder:"BLW INVENTORY APP",resource_type:"image"})
       }catch(error){
          throw new Error("Image could not be uploaded")
       }

        fileData={
             fileName:req.file.originalname,
             filePath:uploadedFile.secure_url,//req.file.path
             fileType:req.file.mimetype,
             filesize:fileSizeFormatter(req.file.size,2)
        }
    }

    //Create Product
    const product=await Product.create({
        user:req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
       
        image:fileData
    })
   res.status(201).json(product)

});

//Get all Products
const getProducts=asyncHandler(async (req,res)=>{

    const products=await Product.find(
        {
            user:req.user._id
        }
    ).sort("-createdAt");

    res.status(200).json(products)
})

//Get the single product
const getProduct=asyncHandler(async (req,res)=>{
    const product=await Product.findById(req.params.id)
    if(!product)
    {
        res.status(404)
        throw new Error("Product not found")
    }

    if(product.user.toString() !== req.user.id)
    {
        res.status(401);
        throw new Error("User not authourised");
    }
    res.status(200).json(product);
})

//Delete Product
const deleteProduct=asyncHandler(async (req,res)=>{
    const product=await Product.findById(req.params.id)
    if(!product)
    {
        res.status(404)
        throw new Error("Product not found")
    }

    if(product.user.toString() !== req.user.id)
    {
        res.status(401);
        throw new Error("User not authourised");
    }
    await Product.deleteOne({_id:product._id})
    res.status(200).json({message:"Product deleted."});
    
})

//Update Product
const updateProduct=asyncHandler(async (req,res)=>{
    const {name,category,quantity,price,description,purchasedAt}=req.body;

    const product=await Product.findById(req.params.id)
    //if prouct not found
     if(!product)
     {
        res.status(404);
        throw new Error("Product not found")
     }
     //Match product to its user
     if(product.user.toString() !== req.user.id)
     {
        res.status(401);
        throw new Error("User not Authorised");
     }
    //Handle Image Upload
    let fileData={};
    if(req.file){
//Save image to cloudinary
        let uploadedFile;
       try{
        uploadedFile= await cloudinary.uploader.upload(req.file.path,{folder:"BLW INVENTORY APP",resource_type:"image"})
       }catch(error){
          throw new Error("Image could not be uploaded")
       }

        fileData={
             fileName:req.file.originalname,
             filePath:uploadedFile.secure_url,//req.file.path
             fileType:req.file.mimetype,
             filesize:fileSizeFormatter(req.file.size,2)
        }
    }

    //Update Product
    const updatedProduct=await Product.findByIdAndUpdate({
       _id: req.params.id
    },{
        name,
        
        category,
        quantity,
        price,
        description,
        purchasedAt,
        image: Object.keys(fileData).length === 0? product?.image : fileData
    },{
        
            new :true,
            runValidators:true
         })
      
         res.status(200).json(updatedProduct)
});


module.exports={
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct
}