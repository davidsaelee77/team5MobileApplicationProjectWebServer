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

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

router.get("/", (req, res) => {
    if (req.query.memberid) {
        let theQuery = "SELECT MemberID_A, MemberID, Username, FirstName, LastName FROM Members INNER JOIN Contacts ON Members.memberid = Contacts.memberid_b";
        pool.query(theQuery)
            .then(result => {
                if (result.rowCount > 0) {
                    let myResult = result.rows;
                    myResult = myResult.filter(function (element) {
                        // Leave this comparison as '==' and not '===' because int vs string of int
                        return element.memberid_a == req.query.memberid;
                    });
                    myResult.forEach(element => delete element.memberid_a);
                    res.status(200).send({
                        success: true,
                        message: myResult
                    });
                } else {
                    res.status(200).send({
                        success: true,
                        message: {}
                    })
                }
            })
            .catch(err => {
                res.status(400).send({
                    message: err.detail + "here!"
                })
            });
    } else {
        res.status(400).send({
            message: "No username provided"
        });
    }
});

router.delete("/:memberID_A/:memberID_B", (request, response, next) => {
        //validate on empty parameters
        if (!request.params.memberID_A || !request.params.memberID_B) {
            response.status(400).send({
                message: "Missing required information"
            });
        } else if ((isNaN(request.params.memberID_A) || isNaN(request.params.memberID_B))) {
            response.status(400).send({
                message: "Malformed parameter. Member ID must be a number"
            });
        } else {
            next();
        }
    }, (request, response, next) => {
        //validate chat id exists
        let query = 'SELECT * FROM CONTACTS WHERE MemberID_A = $1 AND MemberID_B = $2';
        let values = [request.params.memberID_A, request.params.memberID_B];
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
        })
    }, (request, response) => {
        //Delete the Contact from the table
        let insert = `DELETE FROM Contacts
                  WHERE MemberID_A = $1
                  AND MemberID_B = $2`;
        let values = [request.params.memberID_A, request.params.memberID_B];
        pool.query(insert, values)
            .then(result => {
                response.send({
                    success: true
                })
            }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
    }
);

router.post("/", (request, response, next) => {
    //validate on empty parameters
    if (!request.body.memberid_a || !request.body.memberid_b) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.body.memberid_a) || (isNaN(request.body.memberid_b))) {
        response.status(400).send({
            message: "Malformed parameter. member ID must be a number"
        });
    } else {
        next();
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM MEMBERS WHERE MEMBERID IN ($1, $2)';
    let values = [request.body.memberid_a, request.body.memberid_b];
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
            message: "SQL Error",
            error: error
        });
    });
}, (request, response, next) => {
    //add the message to the database
    let insert = 'INSERT INTO Contacts(MemberID_A, MemberID_B, Verified) VALUES($1, $2, $3)';
    let values = [request.body.memberid_a, request.body.memberid_b, 1];
    pool.query(insert, values)
        .then(result => {
            if (result.rowCount == 1) {
                //TODO: Do something here
                next();
            } else {
                response.status(400).send({
                    "message": "unknown error"
                });
            }
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error on insert",
            error: err
        });
    });
}, (request, response) => {
    // send a notification of this message to ALL members with registered tokens
    let query = `SELECT token FROM Push_Token
                        INNER JOIN Contacts ON
                        Push_Token.memberid = Contacts.memberid_B
                        WHERE Contacts.MEMBERID_A=$1`;
    let values = [request.body.memberid_a];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry =>
                msg_functions.sendMessageToIndividual(
                    entry.token,
                    response.message));
            response.send({
                success:true
            });
        }).catch(err => {
        response.status(400).send({
            message: "SQL Error on select from push token",
            error: err
        });
    });
});


module.exports = router;