const express = require("express");
const router = express.Router();
const db_handler = require("../config/db");
const input_sanitizer = require('../config/input-sanitiser');

router.get('/:post_id', async (req, res) => {
    const post_id = req.params.post_id;
    const post = await db_handler.getPost(post_id);

    post.content = input_sanitizer.reconvertSpecialLines(post.content);

    if (post.image) {
        post.image = post.image.toString('base64');
    }

    res.render("post", {post: post});
});


module.exports = router;