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

module.exports = router;