const express = require("express");
const router = express.Router();
const db_handler = require("../config/db");

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.clearCookie('sessionId');
        res.redirect('/');
    });
});

router.delete('/delete-post/:postId', async (req, res) => {
    const userId = req.session.userid;
    const postId = req.params.postId;
    const post = await db_handler.getPost(postId);

    if (!post) {
        console.error('Post not found');
        return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userid != userId) {
        console.error('User is not authorized to delete this post');
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        await db_handler.deletePost(postId);
        console.log('Post deleted successfully');
        return res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;