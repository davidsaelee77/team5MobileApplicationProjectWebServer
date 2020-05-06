/**
 * Gets the connection to our Heroku Database
 */
let pool = require('./sql_conn.js');

/**
 * Crypto module required for hashing
 */
const crypto = require("crypto");

/**
 * Nodemailer allows web service to send emails to users
 */
const nodemailer = require("nodemailer");

/**
 * Nodemailer requires a transporter object for use; using gmail instead of
 * SMTP for now
 *
 * Server email password in environment variables
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "team5tcss450server@gmail.com",
        pass: process.env.EMAIL_AUTH
    }
});

/**
 * Sends an email via Nodemailer
 * @param from {String} email address of sender (Nodemailer will auto set to gmail account mail)
 * @param receiver {String} email address of recipient
 * @param subj {String} subject line
 * @param textMessage {String} email body text
 */
function sendEmail(from, receiver, subj, textMessage/*, htmlMessage*/) {
    let mailOptions = {
        from: from,
        to: receiver,
        subject: subj,
        text: textMessage/*,
        html: htmlMessage*/
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex");
}

module.exports = {
    pool, getHash, sendEmail
};