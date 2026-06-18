const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req,res, next) => {
    try {
        let token;

        // To check for token in Headers

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }else if (req.cookies.token) {
            token = req.cookies.token;
        }
        if (!token) {
            return res.status(401).json({
                message: 'Not authorised to access this route'
            });
        }

        // To Verify the Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                message: 'User not found'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Not authorised to access the route'
        });
    }
};

// To check if user is a partner

exports.checkPartner = async (req,res,next) => {
    try {
        const entry = await require('../models/Entry').findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                message: 'Entry not found'
            });
        }

        // To Allow access if user is an admin/creator or a partner
        const isCreator = entry.userId.toString() === req.user._id.toString();
        const isPartner = req.user.partnerId && 
                         entry.userId.toString() === req.user.partnerId.toString();

        if (!isCreator && !isPartner) {
            return res.status(403).json({
                message: 'Not authorised to access this entry'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            message: 'Server error'
        });
    }
};