//express is the framework we're going to use to handle requests
const express = require('express');

//Access the connection to Heroku Database
let pool = require('../utilities/utils').pool;


let router = express.Router();

//This allows parsing of the body of POST requests, that are encoded in JSON
//router.use(require("body-parser").json())

/**
 * Package for parsing JSON
 */
const bodyParser = require("body-parser");

/**
 * This allows parsing of the body of POST requests, that are encoded in JSON
 */
router.use(bodyParser.json());

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {String} name the name for the chat
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 * 
 * @apiError (400: Unknown user) {String} message "unknown email address"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiError (400: Unknown Chat ID) {String} message "invalid chat id"
 * 
 * @apiUse JSONError
 */ 
router.post("/", (request, response, next) => {
    if (!request.body.name) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else {
        next();
    }
}, (request, response) => {
    let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`;
    let values = [request.body.name];
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true,
                chatID:result.rows[0].chatid
            });
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            });
        });
});

/**
 * @api {put} /chats?=param Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 * 
 * @apiDescription Adds the memberId into the associated chatId. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to add the user to
 * @apiParam {Number} memberId the member to add to the chat
 * 
 * @apiSuccess {boolean} success true when the name is inserted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatId not found"
 * @apiError (404: Member Not Found) {String} message "memberId not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. memberId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.put("/", (request, response, next) => {
    //validate on empty parameters
    if (!request.query.chatId || !request.query.username) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.query.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else if (request.query.username == null) {
        response.status(400).send({
            message: "Malformed parameter. username must be alphanumeric"
        });
    } else {
        console.log("pass verify input");
        next();
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.query.chatId];
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Chat ID not found"
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
        //code here based on the results of the query
}, (request, response, next) => {
    //validate memberId exists
    //TODO: Check assumption, do not need to verify that a valid token has a valid memberId

    //TODO: If you're at this step, you are correct in that our middleware has already checked that the token is valid,
    // so I agree that we don't have to check memberID of token.
    // What we should instead be checking is that the memberID associated with the token is in the chat we're adding to.
    // Right now, we have the security hole in that any user who has a valid JWT can add anyone to any chat given
    // a number. {Patrick}
    let query = 'SELECT MemberID FROM Members WHERE Username=$1';
    let values = [request.query.username];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Username not found"
                });
            } else {
                //user found
                request.memberId = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        });
}, (request, response, next) => {
        //validate memberId does not already exist in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberID=$2';
        let values = [request.query.chatId, request.memberId];
    
        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: "user already joined"
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
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`;
    let values = [request.query.chatId, request.memberId];
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
 * @api {get} /chats?=params Request to get the emails of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 * 
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.get("/", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.query.chatId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.query.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number",
            chatId: request.query.chatId
        });
    } else {
        next();
    }
},  (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.query.chatId];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                });
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the members
        let query = `SELECT Members.Email 
                    FROM ChatMembers
                    INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId
                    WHERE ChatId=$1`;
        let values = [request.query.chatId];
        pool.query(query, values)
            .then(result => {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                });
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                });
            });
});

/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 * 
 * @apiDescription Does not delete the user associated with the required JWT but 
 * instead deletes the user based on the email parameter.
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 * 
 * @apiSuccess {boolean} success true when the name is deleted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.delete("/", (request, response, next) => {
    //validate on empty parameters
    if (!request.query.chatId || !request.query.email) {
        response.status(400).send({
            message: "Missing required information"
        });
    } else if (isNaN(request.query.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        });
    } else {
        next();
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1';
    let values = [request.query.chatId];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
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
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Email=$1';
    let values = [request.query.email];

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                });
            } else {
                request.query.email = result.rows[0].memberid;
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            });
        })
}, (request, response, next) => {
        //validate email exists in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2';
        let values = [request.query.chatId, request.query.email];
    
        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    next();
                } else {
                    response.status(400).send({
                        message: "user not in chat"
                    });
                }
            }).catch(error => {
                response.status(400).send({
                    message: "SQL Error",
                    error: error
                });
            });

}, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`;
    let values = [request.query.chatId, request.query.email];
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

module.exports = router;