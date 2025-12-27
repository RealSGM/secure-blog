const express = require("express");
const router = express.Router();
const db_handler = require('../config/db');

router.get('/', async (req, res) => {
    // Get all posts under session user id
    let posts = [];

    try {
        const userID = req.session.userid;
        posts = await db_handler.getAllPostsByUserID(userID);
    }
    catch (error) {
        console.error('Error fetching posts:', error);
    }

    res.render('myposts', {posts: posts});
});

module.exports = router;
