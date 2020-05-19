const WEATHER_KEY = process.env.OWM_API_KEY;

//express is the framework we're going to use to handle requests
const express = require('express');

//request module is needed to make a request to a web service
const request = require('request');

const router = express.Router();

const TOTAL_HOURLY = 24;

const TOTAL_DAILY = 5;
const LATITUDE = 47.2451;
const LONGITUDE = 122.4380;


router.get("/", (req, res) => {
    res.type("application/json");
    let url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + LATITUDE + "&lon=" + LONGITUDE +
        "&exclude=&appid=" + WEATHER_KEY;
    let currentData = {};
    let hourData = {
        data: []
    };
    let dayData = {
        data: []
    };
    request(url, function (error, response, body) {
        if (error) {
            res.send(error);
        } else {
            let newBody = JSON.parse(body);
            let current = newBody.current;
            let daily = newBody.daily;
            let hourly = newBody.hourly;

            currentData.temp = current.temp;
            currentData.weather = current.weather[0].main;

            for (let i = 0; i < TOTAL_HOURLY; i++) {
                let newEntry = {};
                newEntry.tempMin = hourly[i].temp;
                newEntry.weather = hourly[i].weather[0].main;
                hourData.data.push(newEntry);
            }
            for (let i = 0; i < TOTAL_DAILY; i++) {
                let dayEntry = {};
                dayEntry.tempMin = daily[i].temp.min;
                dayEntry.tempMax = daily[i].temp.max;
                dayEntry.weather = daily[i].weather[0].main;
                dayData.data.push(dayEntry);
            }
            res.status(201).send({
                current: currentData,
                hourly: hourData,
                daily: dayData
            })
        }
    });
});

module.exports = router;