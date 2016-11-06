// This code sample shows how to call and receive external rest service data, within your skill Lambda code.

// var AWS = require('aws-sdk');

var https = require('https');

var sets = [
    {
        name: "",
        questions: [
            {
                term: "",
                definition: ""
            }, {
                term: "",
                definition: ""
            }

        ]
    },
    {
        name: "",
        questions: [
            {
                term: "",
                definition: ""
            }, {
                term: "",
                definition: ""
            }
        ]
    }
]

exports.handler = function( event, context ) {
    var say = "";
    var shouldEndSession = false;
    var myState = "";
    var pop = 0;
    var rank = 0;
    var sessionAttributes = event.session.attributes || {};

    sessionAttributes.applicationState = sessionAttributes.appState || "menu";
    sessionAttributes.applicationState = sessionAttributes.setNumber || 1;

    var states = {
        menu: function (intent, sessionAttributes) {
            handlers = {
                changeSet: function () {
                    sessionAttributes.setNumber++;
                    if (sessionAttributes.setNumber > sets.length) sessionAttributes.setNumber = 1;
                    say = "I've selected Set" + sessionAttributes.setNumber + " " + sets[sessionAttributes.setNumber - 1].name
                    + " for you. Would you like to learn this set or move on to the next set?";
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                changeState: function () {
                    sessionAttributes.appState = intent.slots.answer.value || "menu"
                    say = "";
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                cancel: function () {
                    say = "";
                    shouldEndSession = true;
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                help: function () {
                    say = "";
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                }
            }
            var iStates = {}
            iStates["ChangeSetIntent"] = handlers.changeSet;
            iStates["ChangeStateIntent"] = handlers.changeState;
            iStates["AMAZON.StopIntent"] = iStates["AMAZON.CancelIntent"] = handlers.cancel;
            iStates["AMAZON.HelpIntent"] = handlers.help;

            intentStates[intent.name]();
        },

        learn: function (intent, sessionAttributes) {
            handlers = {
                continue: function () {

                },

                cancel: function () {

                },

                help: function () {

                }
            }
            var iStates = {}
            iStates["ContinueIntent"] = handlers.continue;
            iStates["AMAZON.StopIntent"] = iStates["AMAZON.CancelIntent"] = handlers.cancel;
            iStates["AMAZON.HelpIntent"] = handlers.help;

            intentStates[intent.name]();
        }
    };

    if (event.request.type === "LaunchRequest") {
        say = "Welcome to Quizlex! You have " + questions.length + " sets to study. I've selected Set 1 " + sets[0].name
        + " for you. Would you like to learn this set or move on to the next set?";
        context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
    } else {
        states[sessionAttributes.appState](event.request.intent);
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
