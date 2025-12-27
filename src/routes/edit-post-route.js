const express = require("express");
const db_handler = require('../config/db');
const router = express.Router();
const input_sanitizer = require('../config/input-sanitiser');
const multer = require('multer');
const storage = multer.memoryStorage();
const rateLimit = require('../middleware/rate-limit');

// Create a file filter to check the file type
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: fileFilter
});


router.get('/:post_id', async (req, res) => {
    const post_id = req.params.post_id;
    const post = await db_handler.getPost(post_id);
    const userid = req.session.userid;

    if (post.userid !== userid) {
        return res.redirect('/home');
    }

    post.content = input_sanitizer.reconvertSpecialLines(post.content);

    if (post.image) {
        post.image = post.image.toString('base64');
    }

    res.render("edit-post", {post: post});
});

router.post('/:post_id', rateLimit.postLimiter, upload.single('imageUpload'), async (req, res) => {
    const post_id = req.params.post_id;
    let post_data = await db_handler.getPost(post_id);
    const userID = req.session.userid;

    if (post_data.userid !== userID) {
        return res.redirect('/home');
    }

    // Get the form data
    let title_field = req.body.title_field;
    let content_field = req.body.content_field;
    
    // Get the image data, use old image if no new image is uploaded
    const image = req.file ? req.file.buffer : post_data.image;

    // Sanitize the input
    title_field = input_sanitizer.stripHTMLTagsAndTrim(title_field);
    content_field = input_sanitizer.stripHTMLTagsAndTrim(content_field);
    title_field = input_sanitizer.removeSpecialNewlines(title_field);
    content_field = input_sanitizer.replaceNewlines(content_field);

    try {
        await db_handler.editPost(post_id, title_field, content_field, image);
        res.redirect('/myposts');
    }
    catch (error) {
        console.error('Error updating post:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;