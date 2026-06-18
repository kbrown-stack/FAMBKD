const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// To Generare Token for the JWT 

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// To send Token Response 

const sendTokenResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // this shows 7days duration in a week.
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    res
        .status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                partnerId: user.partnerId,
            },
        });

}

// Register User

exports.register = async (req, res, next) => {
    try {
        const {name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists'});
        }

        // Create user with Unique invitecode

        const inviteCode = crypto.randomBytes(4).toString('hex');
        const user = await User.create({
            name,
            email,
            password,
            inviteCode,
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};

// Login User

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password'});
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// Get the Current User

exports.getMe = async (req,res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('partnerId', 'name email');
        res.status(200).json({
            success: true, 
            user
        });

    } catch (error) {
        next(error);
    }
};

// Link Partners 

exports.linkPartner = async (req, res, next) => {
    try {
        const { inviteCode } = req.body;
        const partner = await User.findOne({ inviteCode });

        if (!partner) {
            return res.status(404).json({message: 'Invalid invite Code' });
        }
         if (partner._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
            message: 'Canannot link to self'
        })
    }

    // To link both partners
    req.user.partnerId = partner._id;
    partner.partnerId = req.user._id;

    await req.user.save();
    await partner.save();

    res.status(200).json({
        success: true,
        message: 'Partner linked  successfully',
        partner: {name: partner.name, email: partner.email },
    });

}catch (error) {
    next(error);
}
    };

   // To Logout

   exports.logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
   };