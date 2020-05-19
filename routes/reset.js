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
 */
router.post('/', (req, res) => {
    res.type("application/json");
    res.status(200).send({
        name: req.body.name,
        pw: req.body.password,
        confirm: req.body.confirm
    });
    if (req.body.name && req.body.password && req.body.confirm && req.body.password === req.body.confirm) {
        let decoded = jwt.decode(req.body.name);
        let values = [decoded.email];
        let theQuery = "SELECT MemberID, Salt FROM Members WHERE Email = $1";
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount > 0) {
                    let updateQuery = "UPDATE Members SET Password = $1 WHERE Email = $2";
                    let salt = result.rows[0].salt;
                    let newPW = getHash(req.body.password, salt);
                    pool.query(updateQuery, [newPW, values[0]])
                        .then(result => {
                            res.status(201).send({
                                success: true,
                                message: "Password updated!"
                            });
                        })
                        .catch(err => {
                            res.status(400).send({
                                message: err.detail
                            });
                        });
                } else {
                    res.status(400).send({
                        message: "Request failed. Please contact support" +
                            " regarding your account"
                    });
                }
            })
            .catch(err => {
                res.status(400).send({
                    message: err.detail
                })
            });
    } else {
        res.status(400).send({
            message: "Invalid request"
        });
    }
});

module.exports = router;