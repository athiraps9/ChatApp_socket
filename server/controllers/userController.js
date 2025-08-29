import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import cloudinary from "../lib/cloudinary.js";
 
//Signup a new user

export const signup = async(req,res)=>{
    const {fullName,email,password,bio} = req.body;
    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success:false,message:"Missing Details"})
        }

        const user = await User.findOne({email});
         
        if(user){
            return res.json({success:false,message:"Account is already exists"})
        }
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password,salt); //encrypt
         
        const newUser = await User.create({
            fullName,email,password: hashedPassword,bio

        });

        const token = generateToken(newUser._id)
        res.json({success:true,userData:newUser,token,message:"Account created successfully"})
    }

    catch(error){

        console.log(error.message);

        res.json({success:false,message:error.message})
    }
}

//controller a login a user

export const login = async(req,res)=>{

    try{
        const {email,password} = req.body;
        const userData = await User.findOne({email})
        const isPasswordCorrect = await bcrypt.compare(password,userData.password);

        if(!isPasswordCorrect){
            return res.json({success:false,message:"invalid credentials"});
        }

         const token = generateToken(userData._id)
        res.json({success:true,userData,token,message:"Login Successfull"})


    } catch(error){

        console.log(error.message);

        res.json({success:false,message:error.message})
         
    }
}

//contoller to check if user is authenticated

export const checkAuth = (req,res)=>{
    res.json({success:true,user:req.user});
}
 

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    // Build the update object
    const updateFields = {};
    if (bio) updateFields.bio = bio;
    if (fullName) updateFields.fullName = fullName;

    // If profilePic is provided, upload to Cloudinary
    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "user_profiles", // optional: organize uploads
      });
      updateFields.profilePic = upload.secure_url;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password"); // exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
