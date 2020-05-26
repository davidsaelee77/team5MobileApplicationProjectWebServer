// @ author: Tyler Lorella

//express is the framework we're going to use to handle requests
const express = require('express');

//Access the connection to Heroku Database
let pool = require('../utilities/utils').pool;

var router = express.Router();

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * @api {get} /chatData?=params Request to get chatIds that the memberId is a part of
 * @apiName GetChatData
 * @apiGroup ChatData
 *
 * @apiDescription Request all chatIds that the specified memberId is a part of
 *
 * @apiParam {Number} memberId the member to look up.
 *
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} chats List of chatIds in the ChatMembers table
 * @apiSuccess {String} chats.chatId The id for this chat
 * @apiSuccess {String} chats.memberId The requesters memberID
 *
 * @apiError (404: MemberID Not Found) {String} message "Member ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberID must be a number"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/", (request, response, next) => {
    //validate MemberID is not empty or non-number
    if (!request.query.memberId) {
        response.status(400).send({
            message: "Missing required information"
        });
    }  else if (isNaN(request.query.memberId)) {
        response.status(400).send({
            message: "Malformed parameter. memberID must be a number"
        });
    } else {
        next();
    }
    
}, (request, response, next) => {
    //validate that the memberID exists
    let query = 'SELECT * FROM Members WHERE MemberId=$1';
    let values = [request.query.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member ID not found"
                });
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error1",
                error: error
        });
    });
}, (request, response) => {
    //perform the Select
    let query = 'SELECT ChatID FROM ChatMembers WHERE MemberId=$1';
    let values = [request.query.memberId];
    pool.query(query, values)
        .then(result => {
            response.send({
                rowCount: result.rowCount,
                rows: result.rows
            });
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error2",
            error: err
        });
    });
});

module.exports = router;
