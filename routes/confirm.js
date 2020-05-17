/**
 * Express used for https requests
 */
const express = require('express');

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
const jwt = require("jsonwebtoken");

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

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
 * This allows parsing of the body of POST requests, that are encoded in url
 */
router.use(bodyParser.urlencoded());

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {get} /confirm?=params verification with parameter
 * @apiName PostConfirm
 * @apiGroup Confirm
 *
 * @apiParam {String} verifier Verification token from email
 *
 * @apiSuccess (Success 201) {String} Message confirming verification success
 *
 * @apiError (400: Unable to verify email currently) {String} message "Invalid token or already verified"
 *
 * @apiError (400: Invalid verification link) {String} message "Invalid token"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.get("/", (req, res) => {
    if (req.query.name) {
        let decoded = jwt.decode(req.query.name);
        let theQuery = "SELECT MemberID FROM Members WHERE Email = $1 AND VERIFICATION = 0";
        let values = [decoded.email];
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount > 0) {
                    let updateQuery = "UPDATE Members SET Verification = 1 WHERE Email = $1";
                    pool.query(updateQuery, values)
                        .then(result => {
                            res.status(201).send({
                                    success: true,
                                    message: values[0] + " verified!"
                            });
                        })
                        .catch(err => {
                            res.status(400).send({
                                message: err.detail
                            });
                        })
                } else {
                    res.status(400).send({
                        message: "Unable to verify email currently"
                    })
                }
            })
            .catch(err => {
                res.status(400).send({
                    message: err.detail
                });
            });
        } else {
        res.status(400);
        res.send({
            message: "Invalid verification link"
        });
    }
});

router.post("/", (req, res) => {
    if (req.body.name) {
        console.log(req.body.name);
        console.log(req.body);
        let decoded = jwt.decode(req.body.name);
        let theQuery = "SELECT MemberID FROM Members WHERE Email = $1 AND VERIFICATION = 0";
        let values = [decoded.email];
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount > 0) {
                    let updateQuery = "UPDATE Members SET Verification = 1 WHERE Email = $1";
                    pool.query(updateQuery, values)
                        .then(result => {
                            res.status(201).send({
                                success: true,
                                message: values[0] + " verified!"
                            });
                        })
                        .catch(err => {
                            res.status(400).send({
                                message: err.detail
                            });
                        })
                } else {
                    res.status(400).send({
                        message: "Email already verified or does not exist"
                    })
                }
            })
            .catch(err => {
                res.status(400).send({
                    message: err.detail
                });
            });
    } else {
        res.status(400);
        res.send({
            message: "Invalid verification link"
        });
    }
});

module.exports = router;