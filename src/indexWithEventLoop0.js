// This code sample shows how to call and receive external rest service data, within your skill Lambda code.

// var AWS = require('aws-sdk');

var https = require('https');

var terms = [
    {
        term: "",
        definition:""
    },
    {
        term: "",
        definition:""
    }
]

exports.handler = function( event, context ) {
    var say = "";
    var shouldEndSession = false;
    var myState = "";
    var pop = 0;
    var rank = 0;
    var sessionAttributes = event.session.attributes || {};

    sessionAttributes.applicationState = sessionAttributes.applicationState || "launch";
    sessionAttributes.applicationState = sessionAttributes.setNumber || 1;

    var states = {
        launch: function (intentName) {
            handlers = {
                changeState: function () {
                    say = "Just say the name of a U.S. State, such as Massachusetts or California.";
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                cancel: function () {
                    say = "You asked for " + sessionAttributes.requestList.toString() + ". Thanks for playing!";
                    shouldEndSession = true;
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                help: function () {
                    say = "Just say the name of a U.S. State, such as Massachusetts or California.";
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                }
            }
            var intentStates = {}
            intentStates["StateRequestIntent"] = handlers.stateRequest;
            intentStates["AMAZON.StopIntent"] = intentStates["AMAZON.CancelIntent"] = handlers.cancel;
            intentStates["AMAZON.HelpIntent"] = handlers.help;

            intentStates[intentName]();
        },

        learn: function (intentName) {
            handlers = {
                stateRequest: function () {

                },

                cancel: function () {
                    //To Implement Later
                },

                help: function () {

                }
            }
            var intentStates = {};

            intentStates[intentName]();
        }
    };

    if (event.request.type === "LaunchRequest") {
        say = "Welcome to Quizlex! You have " + terms.length + " sets to study. I've selected Set 1 for you. ";
        context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
    } else {
        states[sessionAttributes.applicationState](event.request.intent.name);
    }
};

function buildSpeechletResponse(say, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: "<speak>" + say + "</speak>"
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: "<speak>Please try again. " + say + "</speak>"
            }
        },
        card: {
            type: "Simple",
            title: "My Card Title",
            content: "My Card Content, displayed on the Alexa App or alexa.amazon.com"
        },
        shouldEndSession: shouldEndSession
    };
}
