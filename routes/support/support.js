/**
 * Express used for https requests
 */
const express = require('express');

/**
 * Accessing postgresql Heroku database
 */
let pool = require('../../utilities/utils').pool;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

let path = require('path');

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
 * @api {get} /support Request for support page
 * @apiName GetSupport
 * @apiGroup Support
 *
 * @apiParam {String} mode Type of support page requested (r for reset, v for verification)
 * @apiParam {String} name JWT token containing name data
 *
 * @apiSuccess (Success 201) {HTML} path Redirects to appropriate support page
 *
 * @apiError (404: Not Found) {String} message "No such path exists"
 *
 */
router.get("/", (req, res) => {
    if (req.query.mode) {
        if (req.query.mode === 'r') {
            res.status(200).sendFile(path.join(__dirname + '/reset.html'));
        } else if (req.query.mode === 'v') {
            res.status(200).sendFile(path.join(__dirname + '/verify.html'));
        } else {
            res.status(404).send({
                message: "No such path exists"
            });
        }
    } else {
        res.status(404).send({
            message: "No such path exists"
        });
    }
});

module.exports = router;