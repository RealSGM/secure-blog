const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db_handler = require('../config/db');
const emailer = require('../config/emailer');

async function generateUniqueResetToken() {
    let rawToken, hashedToken, exists;
    do {
        rawToken = crypto.randomBytes(32).toString('hex');
        hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        exists = await db_handler.resetTokenExists(hashedToken);
    } while (exists);
    return { rawToken, hashedToken };
}

router.get('/', (req, res) => {
    res.render('forgot-password.ejs', { message: null, resetLink: null });
});

router.post('/', async (req, res) => {
    const email = req.body.email_input;

    try {
        let user = await db_handler.getAccount(email);

        // If email is not found in the database
        if (!user) {
            return res.render('forgot-password.ejs', {
                message: "This email is not registered.",
                resetLink: null
            });
        }
        
        const userid = user.userid;
        user = null;

        // Generate a secure random token
        const { rawToken, hashedToken } = await generateUniqueResetToken();

        // Set expiration time (15 minutes from now)
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        // Store the token in the database
        await db_handler.addResetToken(userid, hashedToken, expires);

        // Generate a reset link
        const resetURL = `http://localhost:3000/reset-password?token=${rawToken}`;
        console.log("Sending reset link")
        console.log(resetURL)
        emailer.sendResetEmail(email, resetURL)

        return res.render('forgot-password.ejs', {
            message: "Reset link generated successfully.",
            resetLink: resetURL
        });

    } catch (err) {
        console.error("Error handling forgot-password:", err);
        return res.render('forgot-password.ejs', {
            message: "Something went wrong. Please try again later.",
            resetLink: null
        });
    }
});



module.exports = router;
