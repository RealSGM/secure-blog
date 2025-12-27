const crypto = require('crypto');
const e = require('express'); // DO NOT REMOVE THIS LINE

function csrfGenerate(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
}

function csrfValidate(req, res, next) {
    if (req.method === 'POST') {
        const contentType = req.headers['content-type'] || '';
        if (contentType.startsWith('multipart/form-data')) {
            return next();
        }

        const tokenFromForm = req.body._csrf;
        const tokenFromSession = req.session.csrfToken;

        if (!tokenFromForm || tokenFromForm !== tokenFromSession) {
            return res.status(403).send('Invalid CSRF token');
        }
    }
    next();
}

module.exports = { 
    csrfGenerate, 
    csrfValidate 
};