const validator = require('validator');
const xss = require('xss');

function normaliseEmail(email) {
    return validator.normalizeEmail(email);
}

function xssSanitise(str) {
    return xss(str);
}

function stripHTMLTags(str) {
    return str.replace(/<\/?[^>]+(>|$)/g, '');
}

function stripHTMLTagsAndTrim(str) {
    return stripHTMLTags(str).trim();
}

// Function that replaces \n with special %n
function replaceNewlines(str) {
    return str.replace(/\n/g, '%n');
}

// Function that replaces %n with \n
function reconvertSpecialLines(str) {
    return str.replace(/%n/g, '\n');
}

function removeSpecialNewlines(str) {
    return str.replace(/%n/g, '');
}

module.exports = {
    stripHTMLTags,
    stripHTMLTagsAndTrim,
    replaceNewlines,
    reconvertSpecialLines,
    removeSpecialNewlines,
    normaliseEmail,
    xssSanitise,
};