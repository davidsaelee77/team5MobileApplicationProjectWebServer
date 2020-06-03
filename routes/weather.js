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
 * @api {get} /weather?params= verification with parameter (optional)
 * @apiName GetWeather
 * @apiGroup Weather
 *
 * @apiParam {String} zip Zipcode for desired location for weather data (optional if lat/long are provided)
 * @apiParam {Number} latitude Latitude for desired location (must be paired with longitude) (optional if zip provided)
 * @apiParam {Number} longitude Longitude for desired location (must be paired with latitude) (optional if zip provided)
 *
 * @apiSuccess (Success 200) {String} location JSON String containing location data
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
    if (req.query.zip && req.query.zip.length === 5) {
        zipcode = req.query.zip;
        let googleUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=zipcode" + zipcode + "&key=" +
            process.env.GOOGLE_API_KEY;
        request(googleUrl, function(error, response, body) {
            if (error) {
                res.send(error);
            } else {
                let googleGeo = JSON.parse(body);
                let latitude = googleGeo.results[0].geometry.location.lat;
                let longitude = googleGeo.results[0].geometry.location.lng;
                let locationInfo = googleGeo.results[0].address_components;
                let cityName = "Unknown";
                for (let i = 0; i < locationInfo.length; i++) {
                    if (locationInfo[i].types.includes("locality") ||
                        locationInfo[i].types.includes("sublocality") ||
                        locationInfo[i].types.includes("sublocality_level_1")) {
                        cityName = locationInfo[i].short_name;
                        break;
                    }
                }
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
                            location: {
                                zip: zipcode,
                                city: cityName,
                                latitude: latitude,
                                longitude: longitude
                            },
                            current: currentData,
                            hourly: hourData,
                            daily: dayData
                        })
                    }
                });
            }
        });
    } else if (req.query.latitude && req.query.longitude) {
        let coords = req.query.latitude + "," + req.query.longitude;
        let latitude = req.query.latitude;
        let longitude = req.query.longitude;
        let googleUrl = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + coords + "&key=" +
            process.env.GOOGLE_API_KEY;
        request(googleUrl, function (error, response, body) {
            if (error) {
                res.send(error);
            } else {
                let zip = "N/A";
                let cityName = "Unknown";
                let locationInfo = JSON.parse(body).results[0].address_components;
                for (let i = 0; i < locationInfo.length; i++) {
                    if (locationInfo[i].types.includes("locality") ||
                        locationInfo[i].types.includes("sublocality") ||
                        locationInfo[i].types.includes("sublocality_level_1")) {
                        cityName = locationInfo[i].short_name;
                    }
                    if (locationInfo[i].types.includes("postal_code")) {
                        zip = locationInfo[i].short_name;
                    }
                }
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
                            location: {
                                zip: zip,
                                city: cityName,
                                latitude: latitude,
                                longitude: longitude
                            },
                            current: currentData,
                            hourly: hourData,
                            daily: dayData
                        });
                    }
                });
            }
        });
    } else {
        res.status(400).send({
            message: "Missing required location info!"
        });
    }
});

module.exports = router;