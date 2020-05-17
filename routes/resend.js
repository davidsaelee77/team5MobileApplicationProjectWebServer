/**
 * Express used for https requests
 */
const express = require("express");

/**
 * sendEmail function in utilities utilizing Nodemailer
 */
let sendVerificationEmail = require('../utilities/utils').sendVerificationEmail;

/**
 * Using express package routing
 */
let router = express.Router();

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");


router.post('/', (request, response) => {
    
    const email = request.body.email

    //when a resend verify email is being sent, we know a valid email has already been entered
    try {
        sendVerificationEmail(email);
        response.status(200).send({
            success: true,
            message: "Email succesfully sent!"
        });
    } catch (err) {
        response.status(400).send({
            message: "Unable to resend verification email"
        });
    }
});