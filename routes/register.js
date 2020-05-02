//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Access the connection to Heroku Database
let pool = require('../utilities/utils').pool;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

let router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

/**
 * @api {post} /register Request to register a user
 * @apiName PostAuth
 * @apiGroup Auth
 *
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
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
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);

        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING Email";
        let values = [first, last, username, email, salted_hash, salt];
        pool.query(theQuery, values)
            .then(result => {
                //We successfully added the user, let the user know
                res.status(201).send({
                    success: true,
                    email: result.rows[0].email
                });
                sendEmail(process.env.EMAIL_SENDER, email, "Welcome!", "Welcome to our app!",
                    "<strong>Welcome to our app!</strong>");
            })
            .catch((err) => {
                //log the error
                //console.log(err)
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