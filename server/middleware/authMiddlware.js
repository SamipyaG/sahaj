import jwt from 'jsonwebtoken'
import User from '../models/User.js';
import Employee from '../models/Employee.js';

const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: "Token Not Provided" })
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY)
        if (!decoded) {
            return res.status(401).json({ success: false, error: "Token Not Valid" })
        }

        // Try to find user in Employee model first
        let user = await Employee.findById(decoded._id).select('-password');

        // If not found in Employee, try User model
        if (!user) {
            user = await User.findById(decoded._id).select('-password');
        }

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" })
        }

        req.user = user
        next()
    } catch (error) {
        console.error('Auth Middleware Error:', error.message)
        return res.status(500).json({ success: false, error: "Authentication failed: " + error.message })
    }
}

export default verifyUser