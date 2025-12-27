const express = require('express');
const app = express();
const port = 3000;

const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser'); 
const db_handler = require('./config/db');
const favicon = require('serve-favicon');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const inputSanitiser = require('./config/input-sanitiser')
const csrf = require('./middleware/csrf');
const rateLimit = require('./middleware/rate-limit');
const emailer = require('./config/emailer');

require('dotenv').config();

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const pgPool = db_handler.getPool();

app.use(session({
    store: new pgSession({
        pool: pgPool,
        tableName: 'sessions',
        createTableIfMissing: true,
    }),
    name: 'sessionId',
    secret: process.env.DB_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000,
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
    }
}));

// Middleware
app.use(csrf.csrfGenerate);
app.use(csrf.csrfValidate);

// Prevent Clickjacking
app.use(helmet.frameguard({ action: 'deny' }));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameAncestors: ["'none'"],
        }
    }
}));

const registerRoute = require('./routes/register-route');
const homeRoute = require('./routes/home-route');
const myPostsRoute = require('./routes/my-posts-route');
const accountRoute = require('./routes/account-route');
const makePostRoute = require('./routes/make-post-route');
const forgotPasswordRoute = require('./routes/forgot-password-route');
const resetPasswordRoute = require('./routes/reset-password-route');
const postsRoute = require('./routes/posts-route');
const editPostRoute = require('./routes/edit-post-route');
const apiRoute = require('./routes/api-route');
const twoFARoute = require('./routes/2fa');

const requireAuth = (req, res, next) => {
    if (!req.session.userid) {
        return res.redirect('/');
    }
    next();
};

const require2FA = (req, res, next) => {
    if (!req.session.twofa_verified) {
        return res.redirect('/2fa/verify');
    }
    next();
};

app.use('/home', requireAuth, require2FA, homeRoute);
app.use('/myposts', requireAuth, require2FA, myPostsRoute);
app.use('/makepost', requireAuth, require2FA, makePostRoute);
app.use('/account', requireAuth, require2FA, accountRoute);
app.use('/posts', requireAuth, require2FA, postsRoute);
app.use('/edit-post', requireAuth, require2FA, editPostRoute);
app.use('/register', registerRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/reset-password', resetPasswordRoute);
app.use('/2fa', twoFARoute);
app.use('/api', apiRoute);

app.get('/', (req, res) => {
    if (req.session.userid && req.session.twofa_verified) {
        return res.redirect('/home'); 
    }
    res.render('index', { message: null });
});

const generate2FACode = () => Math.floor(100000 + Math.random() * 900000).toString();

app.post('/', rateLimit.loginLimiter, async (req, res) => {
    const email = inputSanitiser.normaliseEmail(req.body.email_input);
    const verified = await db_handler.verifyUser(email, req.body.password_input);
    req.body.password_input = '';

    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    if (verified) {
        let user = await db_handler.getAccount(email)
        req.session.userid = user.userid;
        user = null;

        const code = generate2FACode();
        req.session.twofa_code = code;
        req.session.twofa_expires = Date.now() + 5 * 60 * 1000;

        emailer.send2FAEmail(email, code);
        console.log(`2FA has been sent`)
        console.log(code);
        return res.redirect('/2fa/verify');
    }

    return res.render('index', { message: 'Invalid username or password' });
});

app.listen(port, () => {
    console.log(`My app listening on port ${port}!`);
});


