const express = require("express");
const router = express.Router();
const db_handler = require('../config/db');
const isPwned = require('../config/is-pawned');
const inputSanitiser = require('../config/input-sanitiser');

// Display registration from message as empty
router.get('/', (req, res) => {
    res.render('register.ejs', { message: null });
});

// Handle form input requirements
router.post('/', async (req, res) => {
    const email = inputSanitiser.normaliseEmail(req.body.email_input);
    const forename = inputSanitiser.xssSanitise(req.body.forename_input.trim());
    const surname = inputSanitiser.xssSanitise(req.body.surname_input.trim());
    const p1 = req.body.p1_input;
    const p2 = req.body.p2_input;

    // Match check
    if (p1 !== p2) {
        return res.render('register.ejs', { message: "Passwords do not match." });
    }

    // Length check
    if (p1.length < 8 || p1.length > 35) {
        return res.render('register.ejs', { message: "Password must be between 8 and 35 characters long." });
    }

    // Known vulnerable passwords check
    if (await isPwned(p1)) {
        return res.render('register.ejs', { message: "Password is weak, avoid using full words and consider including numbers & symbols." });
    }

    // Account with email already exists check
    const account = await db_handler.getAccount(email);

    if (account) {
        return res.render('register.ejs', { message: "Email already in use" });
    }

    // All checks passed, add user to database
    try {
        await db_handler.addUser(email, p1, forename, surname);
        return res.redirect('/');
    }
    catch (err) {
        return res.render('register.ejs', { message: "An error occurred." });
    }
});

module.exports = router;
