const express = require('express');
const router = express.Router();
const db_handler = require('../config/db');
const crypto = require("crypto");
const isPwned = require('../config/is-pawned');

router.get('/', async (req, res) => {
    const rawToken = req.query.token;

    if (!rawToken) {
        return res.render('reset-password.ejs', {
            message: "Missing or invalid token.",
            tokenIsValid: false,
            token: rawToken
        });
    }
    
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const userId = await db_handler.getUserIdFromResetToken(hashedToken);
    
    if (!userId) {
        await db_handler.deleteResetToken(hashedToken); // Cleanup expired or invalid token
        return res.render('reset-password.ejs', {
            message: "This reset link is invalid or expired.",
            tokenIsValid: false,
            token: rawToken
        });
    }
    
    return res.render('reset-password.ejs', {
        message: null,
        tokenIsValid: true,
        token: rawToken  // Keep raw token to send it back in the POST form
    });    
});

router.post('/', async (req, res) => {
    const { token: rawToken, p1_input: p1, p2_input: p2 } = req.body;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const userId = await db_handler.getUserIdFromResetToken(hashedToken);

    if (!userId) {
        return res.render('reset-password.ejs', { message: "This reset link is invalid or expired.", tokenIsValid: false, token: rawToken });
    }

    // Match check
    if (p1 !== p2) {
        return res.render('reset-password.ejs', { message: "Passwords do not match.", tokenIsValid: true, token: rawToken });
    }

    // Length check
    if (p1.length < 8 || p1.length > 35) {
        return res.render('reset-password.ejs', { message: "Password must be between 8 and 35 characters long.", tokenIsValid: true, token: rawToken });
    }

    // Known vulnerable passwords check
    if (await isPwned(p1)) {
        return res.render('reset-password.ejs', { message: "Password is weak, avoid using full words and consider including numbers & symbols.", tokenIsValid: true, token: rawToken });
    }
    
    await db_handler.updatePassword(userId, p1);
    await db_handler.deleteResetToken(hashedToken);

    return res.render('reset-password.ejs', { message: "Password reset successful! You can now log in.", tokenIsValid: false, token: rawToken });
});


module.exports = router;
