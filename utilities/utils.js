//Get the connection to Heroku Database
let pool = require('./sql_conn.js');


//We use this create the SHA256 hash
const crypto = require("crypto");

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "team5tcss450server@gmail.com",
        pass: process.env.EMAIL_AUTH
    }
});

function sendEmail(from, receiver, subj, textMessage, htmlMessage) {
    let mailOptions = {
        from: from,
        to: receiver,
        subject: subj,
        text: textMessage,
        html: htmlMessage
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