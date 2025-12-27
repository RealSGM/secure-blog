const express = require("express");
const router = express.Router();
const db_handler = require("../config/db");
const inputSanitiser = require('../config/input-sanitiser')

router.get('/', async (req, res) => {
    const posts = await db_handler.getAllPosts();
    res.render('home', { posts: posts, query: ''});
});

router.get('/search', async (req, res) => {
    const query = req.query.query;
    const cleanedQuery = inputSanitiser.xssSanitise(query);

    results = await db_handler.getPostsByQuery(cleanedQuery);
    res.render('home', { posts: results, query: cleanedQuery});
});

module.exports = router;
