/**
 * Express used for https requests
 */
const express = require("express");

/**
 * Jsonwebtoken used for creating tokens/verifying
 */
const jwt = require("jsonwebtoken");

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {get} /searchContacts?params= Request to get members that the searchstring is a part of in the username
 * @apiName GetSearchContacts
 * @apiGroup SearchContacts
 *
 * @apiDescription Request all members that the specified searchString is a part of in the username
 *
 * @apiParam {String} searchString the username to look up.
 *
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} rows List of members in the Members table
 * @apiSuccess {String} username The id for this member
 * @apiSuccess {String} memberId The results memberId
 *
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. searchString must be present"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/", (request, response, next) => { 
    if (!request.query.searchString) {
        response.status(400).send({
            message: "Malformed parameter. searchString must be present"
        });
    } else {
        next();
    }
}, (request, response) => {
    //find the results that are like the searchString
    let query = 'SELECT Username, MemberID FROM Members WHERE Username LIKE $1';
    let parameter = '%' + request.query.searchString + '%';
    let values = [parameter];
    pool.query(query, values)
        .then(result => {
            response.status(200).send({
                rowCount: result.rowCount,
                rows: result.rows
            });
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
        });
    });
});

module.exports = router;