/**
 * Express used for https requests
 */
const express = require('express');

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Accessing hash function in utilities
 */
let getHash = require('../utilities/utils').getHash;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
let jwt = require('jsonwebtoken');

/**
 * Config object for jwt creation
 */
let config = {
    secret: process.env.JSON_SECRET
};

/**
 * @api {get} /auth Request to sign a user in the system
 * @apiName GetAuth
 * @apiGroup Auth
 *
 * @apiHeader {String} authorization "username:password" uses Basic Auth
 *
 * @apiSuccess {boolean} success true when the name is found and password matches
 * @apiSuccess {String} message Authentication successful!
 * @apiSuccess {String} token JSON Web Token
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (404: User Not Found) {String} message "User not found"
 *
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.get('/', (request, response) => {
    if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
        return response.status(401).json({ message: 'Missing Authorization Header' })
    }
    // Obtain auth credentials from HTTP Header
    const base64Credentials =  request.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, theirPw] = credentials.split(':');

    if(email && theirPw) {
        let theQuery = "SELECT Password, Salt, MemberID FROM Members WHERE Email=$1";
        let values = [email];
        pool.query(theQuery, values)
            .then(result => {
                if (result.rowCount === 0) {
                    response.status(404).send({
                        message: 'User not found'
                    });
                    return;
                }
                let salt = result.rows[0].salt;
                //Retrieve our copy of the password
                let ourSaltedHash = result.rows[0].password;

                let memberid = result.rows[0].memberid;

                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt);

                //Did our salted hash match their salted hash?
                if (ourSaltedHash === theirSaltedHash ) {

                    let verifyQuery = "SELECT Verification FROM Members WHERE EMAIL=$1";
                    pool.query(verifyQuery, values)
                        .then(result => {
                            if (result.rows[0].verification === 1) {
                                //credentials match and verified. get a new JWT
                                let token = jwt.sign({username: email},
                                    config.secret,
                                    {
                                        expiresIn: '14 days' // expires in 14 days
                                    }
                                );
                                //package and send the results
                                response.json({
                                    success: true,
                                    message: 'Authentication successful!',
                                    token: token,
                                    memberid: memberid
                                });
                            } else {
                                response.status(400).send({
                                    message: 'Email not yet verified'
                                });
                            }
                        })
                } else {
                    //credentials dod not match
                    response.status(400).send({
                        message: 'Credentials did not match'
                    });
                }
            })
            .catch((err) => {
                //log the error
                //console.log(err.stack)
                response.status(400).send({
                    message: err.detail
                });
            })
    } else {
        response.status(400).send({
            message: "Missing required information"
        });
    }
});

module.exports = router;