import User from './models/User.js';
import bcrypt from 'bcrypt';
import connectToDatabase from './db/db.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const userRegister = async () => {
    try {
        // Wait for the database connection to establish
        await connectToDatabase();
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
        if (existingAdmin) {
            console.log('Admin user already exists');
            await mongoose.disconnect();
            return;
        }

        // Create new admin user
        const hashPassword = await bcrypt.hash("admin", 10);
        const newUser = new User({
            name: "Admin",
            email: "admin@gmail.com",
            password: hashPassword,
            role: "admin"
        });

        await newUser.save();
        console.log('Admin user created successfully');
        
        // Disconnect from database
        await mongoose.disconnect();
    } catch(error) {
        console.error('Error in user registration:', error);
        // Ensure connection is closed even if there's an error
        await mongoose.disconnect().catch(err => console.error('Error disconnecting:', err));
    }
};

userRegister();