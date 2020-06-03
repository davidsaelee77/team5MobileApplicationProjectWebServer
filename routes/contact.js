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
 * Accessing postgresql Heroku database
 */
let pool = require('../utilities/utils').pool;

/**
 * Accessing hash function in utilities
 */
let getHash = require('../utilities/utils').getHash;

const msg_functions = require('../utilities/utils').messaging;

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
 * @api {get} /contact Request to get all contacts of the requesters
 * @apiName GetContact
 * @apiGroup Contact
 *
 * @apiDescription Request to get all of the contacts that the requester has
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiSuccess {Object[]} invitations List of unverified contacts from the contacts table
 * @apiSuccess {String} invitations.memberId The id for the member that has an unverified connection with the requester
 * @apiSuccess {String} invitations.username memberId's username
 * @apiSuccess {String} invitations.firstName The first name for memberId 
 * @apiSuccess {String} invitations.lastName The last name for memberId
 * @apiSuccess {Object[]} contacts List of verified contacts from the contacts table
 * @apiSuccess {String} contacts.memberId The id for the member that has a verified connection with the requester
 * @apiSuccess {String} contacts.username memberId's username
 * @apiSuccess {String} contacts.firstName The first name for memberId 
 * @apiSuccess {String} contacts.lastName The last name for memberId
 * 
 * @apiError (400: Missing Parameters) {String} message "No username provided"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiUse JSONError
 */
router.get("/", (request, response) => { 
    if (request.decoded.memberid) {
        let theQuery = `SELECT Contacts.Verified, MemberID, username, Firstname, Lastname, memberid_b FROM Members 
        INNER JOIN Contacts ON (($1 = Contacts.memberid_b AND Members.memberid = Contacts.memberid_a) 
        OR ($1 = Contacts.memberid_a AND Contacts.memberid_b = Members.memberid))`;
        let values = [request.decoded.memberid];
        pool.query(theQuery, values)
            .then(result => {
                let queryResult = result.rows;
                let invitationResult = [];
                let contactResult = [];
                queryResult.forEach( function (element) {
                    let verified = element.verified;
                    delete element.verified;
                    if (verified == 0) {
                        if (element.memberid_b == request.decoded.memberid) {
                            invitationResult.push(element);
                        }
                    } else {
                        contactResult.push(element);
                    }
                });
                response.status(200).send({
                    success: true,
                    invitations: invitationResult,
                    contacts: contactResult
                });
            })
            .catch(err => {
                response.status(400).send({
                    message: err.detail
                });
            });
    } else {
        response.status(400).send({
            message: "Invalid memberid provided"
        });
    }
});

/**
 * @api {delete} /contact Request to delete a contact between two users
 * @apiName DeleteContact
 * @apiGroup Contact
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} memberId the id of the other member for the contact to be deleted
 * 
 * @apiSuccess {boolean} success true when the contact is deleted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberId must be a number" 
 * @apiError (404: User Not Found) {String} message "Contact does not exist"
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.delete("/", (request, response, next) => {
        //validate on empty parameters
        if (!request.decoded.memberid || !request.query.memberId) {
            response.status(400).send({
                message: "Missing required information"
            });
        } else if ((isNaN(request.decoded.memberid) || isNaN(request.query.memberId))) {
            response.status(400).send({
                message: "Malformed parameter. Member ID must be a number"
            });
        } else {
            next();
        }
    }, (request, response, next) => {
        //validate chat id exists
        let query = `SELECT * 
                    FROM CONTACTS 
                    WHERE (MemberID_A = $1 AND MemberID_B = $2) 
                    OR (MemberID_A = $2 AND MemberID_B = $1)`;
        let values = [request.decoded.memberid, request.query.memberId];
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "Contact does not exist"
                    });
                } else {
                    next();
                }
            }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
    }, (request, response) => {
        //Delete the Contact from the table
        let insert = `DELETE 
                        FROM Contacts 
                        WHERE (MemberID_A = $1 AND MemberID_B = $2)
                        OR (MemberID_A = $2 AND MemberID_B = $1)`;
        let values = [request.decoded.memberid, request.query.memberId];
        pool.query(insert, values)
            .then(result => {
                response.send({
                    success: true
                });
            }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
    }
);

/**
 * @api {post} /contacts Request to add a contact between two users
 * @apiName PostContact
 * @apiGroup Contact
 *
 * @apiDescription Adds a contact between two memberIDs
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} memberId_A the id of member to contact from
 * @apiParam {Number} memberId_B the id of member to contact to
 *
 * @apiSuccess (Success 201) {boolean} success true when the contact is inserted
 *
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (404: Member Not Found) {String} message "Member not found"
 * @apiError (404: Contact Not Found) {String} message "Contact does not exist"
 * 
 * @apiUse JSONError
 */
router.post("/", (request, response, next) => {
    //validate on empty parameters

    if (!request.body.username) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        next();
    }
}, (request, response, next) => {
    //validate member id exists

    let query = 'SELECT * FROM MEMBERS WHERE username = $1 AND memberid <> $2';
    let values = [request.body.username, request.decoded.memberid];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member not found"
                });
            } else {
                response.message = request.decoded.username;
                response.sender = request.decoded.memberid;
                response.receiver = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
        response.status(400).send({
            message: "SQL Error",
            error: error
        });
    });

}, (request, response, next) => {
    let query = 'SELECT * FROM CONTACTS WHERE (MEMBERID_A = $1 AND MEMBERID_B = $2) OR (MEMBERID_B = $1 ' +
        'AND MEMBERID_A = $2)';
    let values = [response.sender, response.receiver];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                next();
            } else {
                response.status(400).send({
                    error: "Existing contact"
                });
            }
        }).catch(err => {
        response.status(400).send({
            error: err
        });
    });
}, (request, response, next) => {
    //add the  unverified contact to the database
    let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, Verified) VALUES($1, $2, $3)';
    let values = [response.sender, response.receiver, 0];
    pool.query(insert, values)
        .then(result => {
            if (result.rowCount == 1) {
                next();
            } else {
                response.status(404).send({
                    "message": "Unexpected error; please contact developers"
                });
            }
        }).catch(err => {
        response.status(400).send({
            //message: "SQL Error on insert",
            error: err
        });
    });
}, (request, response) => {
    // send a notification of this message to ALL members with registered tokens
    let query = `SELECT token FROM Push_Token
                        INNER JOIN Contacts ON
                        Push_Token.memberid = Contacts.memberid_B
                        WHERE Contacts.MEMBERID_A=$1`;
    let values = [request.decoded.memberid];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry =>
                msg_functions.sendContactRequestToIndividual(
                    entry.token,
                    response.message));
            response.status(201).send({
                success:true,
                message: response.message
            });
        }).catch(err => {
        response.status(400).send({
            //message: "SQL Error on select from push token",
            //TODO: we have added the contact but failed sending a pushy request, notify or undo
            error: err + ", Error with pushy"
        });
    });
});


/**
 * @api {put} /contacts accept a contact request between two users
 * @apiName PutContact
 * @apiGroup Contact
 *
 * @apiDescription Sets the contact between two users as verified
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} memberId the id of the member who sent the contact request
 *
 * @apiSuccess (Success 201) {boolean} success true when the contact is verified
 *
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 *
 * @apiError (404: Member Not Found) {String} message "Member not found"
 * @apiError (404: Contact Not Found) {String} message "Contact does not exist"
 * 
 * @apiUse JSONError
 */
router.put("/", (request, response, next) => {
    //validate on empty parameters
    if (!request.query.memberId) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        next();
    }
}, (request, response, next) => { 
    //validate the memberId
    let query = 'SELECT * FROM Members WHERE MemberId=$1';
    let values = [request.query.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member not found"
                });
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error M",
                error: error
            });
        });
}, (request, response, next) => {
    //validate the contact
    let query = `SELECT * 
                FROM Contacts 
                WHERE (MemberID_A=$1 AND MemberID_B=$2) OR (MemberID_A=$2 AND MemberID_B=$1);`;
    let values = [request.decoded.memberid, request.query.memberId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact does not exist"
                });
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error C",
                error: error
            });
        });
}, (request, response) => {
    //set contact to verified
    let update = `UPDATE Contacts 
                SET Verified = 1 
                WHERE (MemberID_A=$1 AND MemberID_B=$2) OR (MemberID_A=$2 AND MemberID_B=$1);`;
    let values = [request.decoded.memberid, request.query.memberId];
   pool.query(update, values)
        .then(result => {
            response.send({
                success: true
            });
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                decode: request.decoded.memberid,
                query: request.query.memberId,
                error: err
            });
        });
});

module.exports = router;