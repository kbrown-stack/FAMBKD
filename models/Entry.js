const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,

    },

    content: {
        type: String,
        required: [true, 'Please provide content']
    }, 

    category: {
        type: String,
        enum: ['tips', 'trips', 'funny', 'moments', 'events', 'other'],
        default: 'other',
    },

    photos: [{
        url: String,
        publicId: String,
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// To Detect Category from first word 

entrySchema.pre('save', function(next) {
    if (this.isNew && this.category === 'other') {
        const firstWord = this.title.toLowerCase().split('')[0];
        const categories = ['tips', 'trips', 'events', 'moments'];

        if (categories.includes(firstWord)) {
            this.category = firstWord;
        }
    }
    next();
});

// To updatedAt on modification

entrySchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next()
});

// To index efficient Querying 

entrySchema.index({ userId: 1, createdAt: -1 });
entrySchema.index({ category: 1 });

module.exports = mongoose.model('Entry', entrySchema);