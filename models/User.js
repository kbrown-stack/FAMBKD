const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a valid Name'],
        trim: true,
    },

    email: {
        type: String,
        required: [true, 'Please provide a valid email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    }, 

    password: {
        type: String,
        required: [true, 'Provide a valid password'],
        minLenth: 6,
        select: false,
    },

    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },


    inviteCode: {
        type: String,
        unique: true,
        sparse: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// To Hash the Password

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// To compare Password methods used

userSchema.methods.comparePassword = async function(candiatePassword) {
    return await bcrypt.compare(candiatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);