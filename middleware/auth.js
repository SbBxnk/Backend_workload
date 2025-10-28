const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
        return res.status(403).json({ message: "No token provided" }); }
    try {
        const secret_token = process.env.TOKEN;
        const decoded = jwt.verify(token, secret_token); 
        req.user = decoded;  
        next(); 
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = authenticate;
