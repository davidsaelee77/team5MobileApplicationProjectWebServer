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
 * Jsonwebtoken used for creating tokens/verifying
 */
const jwt = require("jsonwebtoken");

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * Nodemailer requires a transporter object for use; using gmail instead of
 * SMTP for now
 *
 * Server email password in environment variables
 */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SENDER,
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
 *
 * @param receiver {String} email address of recipient
 */
function sendVerificationEmail(receiver) {
    let token = jwt.sign({email: receiver},
        config.secret,
        {
            expiresIn: '2H' // expires in 2 hours
        }
    );
    const subj = "Welcome! Verification required";

    // Nodemailer sends user verification link
    let emailText = "Welcome to our app!\n\nIn order to use our features, please verify your email at:\n";
    let verifyLink = "https://team5-tcss450-server.herokuapp.com/support?name=" + token;
    // let verifyLink = "http://localhost:5000/support?name=" + token;
    // let emailHtml = emailText + '<a href="' + verifyLink + token + '"><H2>Verification link</H2></a>';
    emailText = emailText + verifyLink;
    // sendEmail(process.env.EMAIL_SENDER, email, "Welcome! Verification required",
    //     emailText, emailHtml);
    sendEmail(process.env.EMAIL_SENDER, receiver, subj,
        emailText);
}

function sendRecoveryEmail(receiver, first, last) {
    let token = jwt.sign({email: receiver},
        config.secret,
        {
            expiresIn: '1H' // expires in 1 hours
        }
    );
    const subj = "Griffon Password Recovery";

    // Nodemailer sends user verification link
    let emailText = "Dear " + first + " " + last + "\nSomebody has requested that the password" 
        + " tied with this email be reset, if this was not you, contact support!\n"
        + "Please click on the following link to continue with the password recovery process\n";

    //TODO: needs splash page
    let recoveryLink = "https://team5-tcss450-server.herokuapp.com/support?name=" + token;
    
    // let recoveryLink = "http://localhost:5000/support?name=" + token;
    // let emailHtml = emailText + '<a href="' + recoveryLink + token + '"><H2>Verification link</H2></a>';
    emailText = emailText + recoveryLink;
    sendEmail(process.env.EMAIL_SENDER, receiver, subj,
        emailText);
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

let messaging = require('./pushy_utilities.js');

module.exports = {
    pool, getHash, sendVerificationEmail, messaging
};