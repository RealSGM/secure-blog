const express = require("express");
const db_handler = require('../config/db');
const router = express.Router();
const input_sanitizer = require('../config/input-sanitiser');
const multer = require('multer');
const storage = multer.memoryStorage();
const { csrfGenerate, csrfValidate } = require('../middleware/csrf');
const rateLimit = require('../middleware/rate-limit');

// Create a file filter to check the file type
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: fileFilter
});

router.get('/', csrfGenerate, (req, res) => {
    res.render('make-post'); 

});

router.post('/', rateLimit.postLimiter, upload.single('imageUpload'), csrfValidate, async (req, res) => {
    let { title_field, content_field } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    title_field = input_sanitizer.stripHTMLTagsAndTrim(title_field);
    content_field = input_sanitizer.stripHTMLTagsAndTrim(content_field);
    title_field = input_sanitizer.removeSpecialNewlines(title_field);
    content_field = input_sanitizer.replaceNewlines(content_field);

    try {
        const userID = req.session.userid;
        const success = await db_handler.addPost(userID, title_field, content_field, imageBuffer);

        if (!success) {
            // Add error message handling here
        }

        return res.redirect('/myposts');

    } catch (error) {
        console.error('Error fetching user ID:', error);
        // Add error message handling here
        return res.redirect('/makepost');
    }
});

module.exports = router;
