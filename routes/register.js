/**
 * Express used for https requests
 */
const express = require("express");

/**
 * Crypto module required for hashing
 */
const crypto = require("crypto");

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
const jwt = require("jsonwebtoken");

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Accessing hash function in utilities
 */
let getHash = require('../utilities/utils').getHash;

/**
 * sendEmail function in utilities utilizing Nodemailer
 */
let sendEmail = require('../utilities/utils').sendEmail;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {post} /auth Request to register a user
 * @apiName PostAuth
 * @apiGroup Auth
 *
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
 * @apiParam {String} username a users handle/username *required unique
 * @apiParam {String} email a users email *required unique
 * @apiParam {String} password a users password
 *
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Username exists) {String} message "Username exists"
 *
 * @apiError (400: Email exists) {String} message "Email exists"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.post('/', (req, res) => {
    res.type("application/json");

    //Retrieve data from query params
    const first = req.body.first;
    const last = req.body.last;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(first && last && username && email && password) {
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING Email";
        let values = [first, last, username, email, salted_hash, salt];
        pool.query(theQuery, values)
            .then(result => {

                // User successfully added, create verification link for user
                let token = jwt.sign({email: email},
                    config.secret,
                    {
                        expiresIn: '2H' // expires in 24 hours
                    }
                );

                // Response informs user of successful registration
                res.status(201).send({
                    success: true,
                    email: result.rows[0].email
                });

                // Nodemailer sends user verification link
                let emailText = "Welcome to our app!\n\nIn order to use our features, please verify your email at:\n";
                let verifyLink = "https://team5-tcss450-server.herokuapp.com/confirm?name=" + token;
                //let verifyLink = "localhost:5000/confirm?name=" + token;
                // let emailHtml = emailText + '<a href="' + verifyLink + token + '"><H2>Verification link</H2></a>';
                emailText = emailText + verifyLink;
                // sendEmail(process.env.EMAIL_SENDER, email, "Welcome! Verification required",
                //     emailText, emailHtml);
                sendEmail(process.env.EMAIL_SENDER, email, "Welcome! Verification required",
                    emailText);
            })
            .catch((err) => {
                if (err.constraint === "members_username_key") {
                    res.status(400).send({
                        message: "Username exists"
                    });
                } else if (err.constraint === "members_email_key") {
                    res.status(400).send({
                        message: "Email exists"
                    });
                } else {
                    res.status(400).send({
                        message: err.detail
                    });
                }
            })
    } else {
        res.status(400).send({
            message: "Missing required information"
        });
    }
});

module.exports = router;