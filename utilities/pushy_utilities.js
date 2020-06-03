let Pushy = require('pushy');

// Plug in your Secret API Key
let pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

//use to send message to a specific client by the token
function sendMessageToIndividual(token, message) {

    //build the message for Pushy to send
    let data = {
        "type": "msg",
        "message": message,
        "chatid": message.chatid
    };

    // Send push notification via the Send Notifications API
    // https://pushy.me/docs/api/send-notifications
    pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
        // Log errors to console
        if (err) {
            return console.log('Fatal Error', err);
        }

        // Log success
        console.log('Push sent successfully! (ID: ' + id + ')');
    })
}

//use to send message to a specific client by the token
function sendContactRequestToIndividual(token, message) {

    //build the message for Pushy to send
    let data = {
        "type": "contact",
        "username": message
    };

    // Send push notification via the Send Notifications API
    // https://pushy.me/docs/api/send-notifications
    pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
        // Log errors to console
        if (err) {
            return console.log('Fatal Error', err);
        }

        // Log success
        console.log('Push sent successfully! (ID: ' + id + ')');
    })
}


//add other "sendYypeToIndividual" functions here. Don't forget to export them

module.exports = {
    sendMessageToIndividual, sendContactRequestToIndividual
};