const express = require("express");
const router = express.Router();
const db_handler = require('../config/db');
const bcrypt = require("bcrypt");
const isPwned = require('../config/is-pawned');
const inputSanitiser = require('../config/input-sanitiser');

router.get('/', async (req, res) => {
    const userID = req.session.userid;

    if (!userID) {
        return res.redirect('/');
    }

    const user = await db_handler.getUserById(userID);

    res.render('account.ejs', {
        user,
        message: null,
    });
});

router.post('/update', async (req, res) => {
    const userID = req.session.userid;

    if (!userID) {
        return res.redirect('/');
    }
    
    const email = inputSanitiser.normaliseEmail(req.body.email.trim());
    const forename = inputSanitiser.stripHTMLTagsAndTrim(req.body.forename);
    const surname = inputSanitiser.stripHTMLTagsAndTrim(req.body.surname);
    const user = await db_handler.getUserById(userID);

    if (email !== user.email) {
        const existing = await db_handler.getAccount(email);
        if (existing) {
            return res.render('account.ejs', {
                user,
                message: "Email already in use.",
                messageType: "error-message",
            });
        }
    }

    await db_handler.updateUserDetails(user.userid, email, forename, surname);
    const updatedUser = await db_handler.getAccount(email);

    return res.render('account.ejs', {
        user: updatedUser,
        message: "Account details updated successfully.",
        messageType: "success-message",
    });
});

router.post('/update-password', async (req, res) => {
    const userID = req.session.userid;

    if (!userID) {
        return res.redirect('/');
    }

    const { current_password, new_password, confirm_password } = req.body;
    const user = await db_handler.getUserById(userID);

    // Check current password
    const pepperedPassword = current_password + process.env.PEPPER_SECRET_KEY + user.salt;
    const match = await bcrypt.compare(pepperedPassword, user.hashed_password);

    // Check passwords match
    if (new_password !== confirm_password) {
        return res.render('account.ejs', {
            user,
            message: "New passwords do not match.",
            messageType: "error-message",
        });
    }

    // Length check
    if (new_password.length < 8 || new_password.length > 35) {
        return res.render('account.ejs', {
            user,
            message: "Password must be between 8 and 35 characters long.",
            messageType: "error-message",
        });
    }

    if (!match) {
        return res.render('account.ejs', {
            user,
            message: "Current password is incorrect.",
            messageType: "error-message",
        });
    }

    // Known vulnerable passwords check
    if (await isPwned(new_password)) {
        return res.render('account.ejs', {
            user,
            message: "This password has been exposed in a data breach. Please choose a stronger password.",
            messageType: "error-message",
        });
    }

    // Update the password
    await db_handler.updatePassword(user.userid, new_password);

    return res.render('account.ejs', {
        user,
        message: "Password updated successfully.",
        messageType: "success-message"
    });
});

module.exports = router;
