//TODO: Clean this class up

/**
 * Express used for https requests
 */
const express = require("express");

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * sendRecoveryEmail function in utilities utilizing Nodemailer
 */
let sendChangePasswordEmail = require('../utilities/utils').sendChangePasswordEmail;

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
let jwt = require('jsonwebtoken');

/**
 * Config object for jwt creation
 */
config = {
    secret: process.env.JSON_SECRET
};

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /messages Request send a particular user's email address a password change request
 * @apiName PostChangePassword
 * @apiGroup ChangePassword
 *
 * @apiDescription Adds the message from the user associated with the required JWT.
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the id of th chat to insert this message into
 *
 * @apiSuccess (Success 201) {boolean} acknowledge true when the service has succesfully performed the query
 * regardless if the email passed in exists or not
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.post('/', (request, response) => {
    response.type("application/json");
    const email = request.body.email;

    let theQuery = "SELECT FirstName, LastName FROM Members WHERE Email=$1";
    let values = [email];

    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(201).send({
                    acknowledge: true,
                });
                return;
            }
            let first = result.rows[0].firstname;
            let last = result.rows[0].lastname;

            //send password reset email using firstname and lastname
            sendChangePasswordEmail(email, first, last);

            response.status(201).send({
                acknowledge: true
            });
        })
        .catch((err) => {
            //unable to query, log error
            //TODO: Okay for error response here?
            response.status(400).send({
                acknowledge: false,
                message: err.detail
            });
        });
});

module.exports = router;