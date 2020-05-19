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


router.get("/:memberId?", (request, response, next) => {
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
    //User "David" passes in his MemberID, 
    //Server returns a JSON with every ChatID that "David" is in
    let query = 'SELECT * FROM ChatMembers WHERE MemberId=$1';
    let values = [request.query.memberId];
    pool.query(query, values)
        .then(result => {
            response.send({
                memberId: request.query.memberId,
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
