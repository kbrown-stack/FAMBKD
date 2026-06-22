const Entry = require('../models/Entry');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../config/email');
const streamifier = require('streamifier');

// Create Entry

exports.createEntry = async (req,res,next) => {
    try {
        const { title, content, category } = req.body;
        const photos = [];

        // console.log('Files received:', req.files); // added console
        // console.log('Body received:', req.body);

        // To Upload Photos to the Cloudinary if present

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {

             try {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'family-planner' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(file.buffer).pipe(uploadStream);
                });
                    
                photos.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError); // added this consoole here 
                return res.status(500).json({messsage: 'Photo upload failed'}); 
            }
        }
    }

        const entry = await Entry.create({
            userId: req.user._id,
            title,
            content,
            category,
            photos,
        });

        res.status(201).json({
            success: true, entry
        });

    } catch (error) {
        console.error('createEntry error:', error.messsage); // added this consoole here 
        next(error);
    }
};


// Get all Entries for Users and Partners

exports.getEntries = async (req,res, next) => {
    try {
        const { category, sort = '-createdAt', page = 1, limit = 10 } = req.query;

        const query = {
            $or: [
                { userId: req.user._id },
                ...(req.user.partnerId ? [{ userId: req.user.partnerId }] : []),
            ],
        };

        if (category) {
            query.category = category;
        }

        const entries = await Entry.find(query)
                .sort(sort)
                .limit(limit *1)
                .skip((page - 1) * limit)
                .populate('userId', 'name')
                .exec();

                const count = await Entry.countDocuments(query);

                res.status(200).json({
                    success: true,
                    entries,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                });

    } catch (error) {
        next(error);
    }
};

// Get a Single Entry

exports.getEntry = async (req,res,next) => {
    try {
        const entry = await Entry.findById(req.params.id).populate('userId', 'name');

        if (!entry) {
            return res.status(404).json({
                messsage: 'Entry not found'
            });
        }
        res.status(200).json({
            success: true, entry
        });
    } catch (error) {
        next(error);
    }
};

// Update Entry

exports.updateEntry = async (req, res, next) => {
    try {
        const { title, content, category } = req.body;
        const entry = await Entry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                messsage: 'Entry not found'
            });
        }

        // Note that only Creator can update
        if (entry.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                messsage: 'Not authorised to update this entry'
            });
        }

        //To Handle new Photos

        const newPhotos = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    { folder: 'family-planner' }
                );
                newPhotos.push({
                    url: result.secure_url,
                    publicId: result.publicId,
                });
            }
        }
        entry.title = title || entry.title;
        entry.content = content || entry.content;
        entry.category = category || entry.category;
        if (newPhotos.length > 0 ) {
            entry.photos = [...entry.photos, ...newPhotos];
        }

        await entry.save();

        res.status(200).json({
            success: true, 
            entry
        });

    } catch  (error) {
        next(error);
    }
};

// To Delete Entry

exports.deleteEntry = async (req,res,next) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                messsage: 'Entry not found'
            });
        }
        // Note , only admin can delete

        if (entry.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                messsage: 'Not authorised to delete entry'
            });
        }

        // To delete Photos from the Cloudinary app
        for (const photo of entry.photos) {
            await cloudinary.uploader.destroy(photo.publicId);
        }
        await entry.deleteOne();
        res.status(200).json({
            success: true,
            messsage: 'Entry Deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
};

// To Delete Photo from entry

exports.deletePhoto = async (req,res, next) => {
    try {
        const entry = await Entry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({
                messsage: 'Entry not found'
            });
        }
        if (entry.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                messsage: 'Not authorised'
            });
        }
        const photo = entry.photos.id(req.params.photoId);
        if (!photo) {
            return res.status(404).json({
                messsage: 'Photo not found'
            });
        }
        await cloudinary.uploader.destroy(photo.publicId);
        entry.photos.pull(req.params.photoId);
        await entry.save();

        res.status(200).json({
            success: true,
            entry
        });
    } catch (error) {
        next(error);
    }
};


// To send weekly updates/Memory emails.

exports.sendWeeklyMemory = async () => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const entries = await Entry.find({
            createdAt: { $gte: oneWeekAgo },
        }).populate('userId', 'name email partnerId');

        const sentTo = new Set();

        for (const entry of entries) {
            const user = entry.userId;
            const recipients = [user.email];

            if (user.partnerId) {
                const partner = await require('../models/User').findById(user.partnerId);
                if (partner) recipients.push(partner.email);
            }
            for (const email of recipients) {
                if (sentTo.has(email)) continue;

                await sendEmail({
                    email,
                    subject: 'Memory/Update of the week',
                    html: `${entry.title}
                    ${entry.content.substring(0,200)}
                    Created by ${user.name} on ${entry.createdAt.toLocaleDateString()}
                    View Full Update/Memory`,
                });

                sentTo.add(email);
                //Adding delay between emails
                await new Promise(resolve => setTimeout(resolve, 1000)); // This add a one second delay
            }
        }

        console.log(`Weekly updates/memories sent to ${sentTo.size} recipients`);
    } catch (error) {
        console.error('Error sending weekly updates and memories:' , error);
    }
};


