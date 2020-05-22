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
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * UTF-8 Validator module
 */
const isValidUTF8 = require('utf-8-validate');

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
let sendVerificationEmail = require('../utilities/utils').sendVerificationEmail;

/**
 * Using express package routing
 */
let router = express.Router();

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
 *
 * @apiError (400: Encoding Error) {String} message "Encoding incompatible"
 *
 * @apiError (400: Parameters Invalid) {String} message "Invalid parameters for request"
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
        const allFields = [first, last, username, email, password];
        const bufferFields = allFields.map(field => Buffer.from(field));
        const checkFields = bufferFields.map(buffer => isValidUTF8(buffer));
        if (checkFields.includes(false)) {
            res.status(400).send({
                message: "Non UTF-8 encoding found; cannot process"
            })
        } else {
            let passwordTest = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");
            if (!passwordTest.test(password) || username.length > 32 || username.length < 4 || !email.includes("@")) {
                res.status(400).send({
                    message: "Invalid parameters!"
                });
            } else {
                let salt = crypto.randomBytes(32).toString("hex");
                let salted_hash = getHash(password, salt);

                let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING Email";
                let values = [first, last, username, email, salted_hash, salt];
                pool.query(theQuery, values)
                    .then(result => {
                        // Response informs user of successful registration
                        res.status(201).send({
                            success: true,
                            email: result.rows[0].email
                        });
                        sendVerificationEmail(result.rows[0].email);
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
                    });
            }
        }
    } else {
        res.status(400).send({
            message: "Missing required information"
        });
    }
});

module.exports = router;