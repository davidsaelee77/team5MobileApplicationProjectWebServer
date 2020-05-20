/**
 * Get open weather API key from environment/config vars
 */
const WEATHER_KEY = process.env.OWM_API_KEY;

/**
 * Express used for http requests
 */
const express = require('express');

/**
 * Request module used for requests to other APIs
 */
const request = require('request');

/**
 * Express package routing
 */
const router = express.Router();

/**
 * Number of hourly weather data instances to show
 */
const TOTAL_HOURLY = 24;

/**
 * Number of daily weather data instances
 */
const TOTAL_DAILY = 5;

/**
 * @api {get} /weather?=params verification with parameter (optional)
 * @apiName GetWeather
 * @apiGroup Weather
 *
 * @apiParam {String} zip Zipcode for desired location for weather data
 *
 * @apiSuccess (Success 200) {String} current JSON string containing current weather data
 *
 * @apiSuccess (Success 200) {String} hourly JSON string containing weather data for 24 hours
 *
 * @apiSuccess (Success 200) {String} daily JSON string containing weather data for 5 days
 *
 * @apiError (400: Geocode API request error) {String} message API request error
 *
 * @apiError (400: OpenWeather API request error) {String} message API request error
 *
 */
router.get("/", (req, res) => {
    res.type("application/json");
    let latitude = "47.2451";
    let longitude = "122.4380";
    let zipcode = "98402";
    if (req.query.zip) {
        zipcode = req.query.zip;
    }
    let geoUrl = "https://geocode.xyz/" + zipcode + "?region=US&json=1&auth=" + process.env.GEOCODE_API_KEY;
    request(geoUrl, function(error, response, body) {
        if (error) {
            res.send(error);
        } else {
            let geo = JSON.parse(body);
            latitude = geo.latt;
            longitude = geo.longt;
            let url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + latitude + "&lon=" + longitude +
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
                        newEntry.temp = hourly[i].temp;
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
                    res.status(200).send({
                        current: currentData,
                        hourly: hourData,
                        daily: dayData
                    })
                }
            });
        }
    });
});

module.exports = router;