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

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + '/verify.html'));
});

module.exports = router;