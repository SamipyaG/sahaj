import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // user_id: {type:Number,required:true,unique:true},
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    profileImage: { type: String },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpiry: {
        type: Date,
        default: null
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model("User", userSchema)
export default User