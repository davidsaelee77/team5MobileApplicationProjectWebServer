//express is the framework we're going to use to handle requests
const express = require('express');

const jwt = require("jsonwebtoken");

//Access the connection to Heroku Database
let pool = require('../utilities/utils').pool;

let router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {post} /params Request verification with parameter
 * @apiName PostConfirm
 * @apiGroup Confirm
 *
 * @apiParam {String} verifier Verification token from email
 *
 * @apiSuccess {String} Message confirming verification success
 *
 * @apiError (400: Invalid verification token) {String} message "Invalid token"
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
                            res.send({
                                    success: true,
                                    message: values[0] + "verified!"
                            });
                        })
                        .catch(err => {
                            res.status(400).send({
                                message: err.detail
                            });
                        })
                } else {
                    res.status(400).send({
                        message: "Email invalid or already verified"
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
            message: "Invalid verification link was provided" + req.query.name
        });
    }
});

module.exports = router;