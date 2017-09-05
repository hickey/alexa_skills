'use strict';
var Alexa = require('alexa-sdk');
var Https = require('https');
var Url = require('url');
//var Math = require('math');


//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.  
//Make sure to enclose your value in quotes, like this: var APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
var APP_ID = "amzn1.ask.skill.078f9a52-af80-47b3-b564-44a1282a8d72";

var HELP_MESSAGE = "You can say tell me a space fact, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

var alexa;
var APIKey = "jMf9vfPfGRmf81ncsaoZIhpLPMJPFRd8mJjdqwkw";
var AsteroidURL = "https://api.nasa.gov/neo/rest/v1/feed?start_date=%DATE%&api_key=%APIKEY%"



//=========================================================================================================================================
//Editing anything below this line might break your skill.  
//=========================================================================================================================================
exports.handler = function(event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetNewFactIntent');
    },
    'GetCloseCalls': function () {
        var url = buildUrl();
        httpGet(url, function(response) {
                var data = JSON.parse(response);
                var hit1m = [];
                var hit7m = [];
                var output = "";
                var cardContent = "Data provided by NASA's NEO API.\n\n";

                // Check if we have correct data, If not create an error speech out to try again.
                if (data === null) {
                    output = "There was a problem with getting data please try again";
                } else {
                    // If we have data.
                    Object.keys(data.near_earth_objects).forEach(function(date) {
                        console.log("Checking %s", date);
                        for (let obj of data.near_earth_objects[date]) {
                            console.log("distance = ", obj.close_approach_data[0].miss_distance.miles);
                            if (parseInt(obj.close_approach_data[0].miss_distance.miles) < 1000000) {
                                console.log("near miss");
                                hit1m.push("On " + date + " Asteroid " + obj.name + " will miss by " + nice_number(obj.close_approach_data[0].miss_distance.miles) +" miles; ");
                            } else if (parseInt(obj.close_approach_data[0].miss_distance.miles) < 7000000) {
                                console.log("close call");
                                hit7m.push("On " + date + " Asteroid " + obj.name + " will miss by " + nice_number(obj.close_approach_data[0].miss_distance.miles) +" miles; ");
                            }
                        }
                    });

                    // put it all together
                    output = "Out of " + data.element_count + " objects,\n\n";
                    console.log("hit1m = " + hit1m.length);
                    console.log("hit7m = " + hit7m.length);
                    if (hit1m.length > 0) {
                        output += "There are " + hit1m.length + " near misses;\n";
                        for (var entry of hit1m) {
                            output += entry;
                        }
                    }
                    if (hit7m.length > 0) {
                        output += "There are " + hit7m.length + " approaches;\n";
                        for (var entry of hit7m) {
                            output += entry;
                        }
                    }
                }

                console.log("output = " + output);
                alexa.emit(":tellWithCard", output, "Near misses", cardContent);
            }
        );
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    }
};


function buildUrl() {
    var date = (new Date()).toISOString().substr(0,10);
    var url = AsteroidURL.replace("%DATE%", date);
    return(url.replace("%APIKEY%", APIKey));
}



// Create a web request and handle the response.
function httpGet(url, callback) {
    console.log("/n URL: "+url);

    var uri = Url.parse(url,true);
    var options = {
        host: uri.host,
        path: uri.path,
        method: 'GET'
    };
    
    console.log("options = %o", options);

    var req = Https.request(options, (res) => {

            var body = '';

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', function () {
                callback(body);
            });

        });
    req.end();

    req.on('error', (e) => {
        console.error(e);
    });
}


function nice_number(num) {
    var spoken_num = "";
    var around_num = function(n, s) {
        var d = s / 100;
        var tn = Math.round(n / d);
        return (tn / 100);
    }
    var sizes = {"trillion": 1000000000000, "billion": 1000000000, "million": 1000000};
    for (var size of Object.keys(sizes)) {
        if (num > sizes[size]) {
            return (around_num(num, sizes[size]) + size);
        }
    }
    return num;
}