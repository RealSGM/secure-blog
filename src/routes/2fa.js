const express = require("express");
const router = express.Router();
const rateLimit = require("../middleware/rate-limit");

router.get('/verify', (req, res) => {
    if (!req.session.userid || !req.session.twofa_code) {
        return res.redirect('/');
    }
    res.render('2fa-verify', { message: null });
});

router.post('/verify', rateLimit.twoFALimiter, (req, res) => {
    const inputCode = req.body.code;
    const storedCode = req.session.twofa_code;
    const expires = req.session.twofa_expires;
    console.log(storedCode)

    if (!storedCode || Date.now() > expires) {
        return res.render('2fa-verify', { message: 'Code expired. Please log in again.' });
    }

    if (inputCode === storedCode) {
        req.session.twofa_verified = true;
        delete req.session.twofa_code;
        delete req.session.twofa_expires;
        return res.redirect('/home');
    }

    return res.render('2fa-verify', { message: 'Invalid code' });
});

module.exports = router;
