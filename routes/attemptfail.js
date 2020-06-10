/**
 * Express used for https requests
 */
const express = require('express');

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

let path = require('path');

/**
 * @api {get} /attemptfail Failure HTML splash for errors after posting.
 * @apiName GetAttemptFail
 * @apiGroup AttemptFail
 *
 * @apiSuccess (Success 201) {HTML} path Redirects to the Failure page
 *
 * @apiError (404: Not Found) {String} message "No such path exists"
 *
 */
router.get("/", (req, res) => {
    res.status(200).sendFile(path.join(__dirname + '/support/support_fail.html'));
});

module.exports = router;