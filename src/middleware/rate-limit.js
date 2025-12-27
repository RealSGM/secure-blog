const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429);
        res.render('index', {
            message: 'Too many login attempts. Please try again in 15 minutes.',
        });
    }
});

const twoFALimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429);
        res.render('2fa-verify', {
            message: 'Too many verification attempts. Please try again in 15 minutes.',
            csrfToken: req.session.csrfToken 
        });
    }
});

const postLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429);
        res.render('make-post', {
            message: 'Too many post attempts. Please try again in 5 minutes.',
            csrfToken: req.session.csrfToken 
        });
    }
});

module.exports = {
    loginLimiter,
    twoFALimiter,
    postLimiter
};