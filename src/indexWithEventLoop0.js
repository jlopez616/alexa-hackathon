// This code sample shows how to call and receive external rest service data, within your skill Lambda code.

// var AWS = require('aws-sdk');

var https = require('https');

exports.handler = function( event, context ) {
    var say = "";
    var shouldEndSession = false;
    var myState = "";
    var pop = 0;
    var rank = 0;
    var sessionAttributes = event.session.attributes || {};

    sessionAttributes.applicationState = sessionAttributes.applicationState || "launch";

    var states = {
        launch: function (intentName) {
            handlers = {
                stateRequest: function () {
                    if (event.request.intent.slots.usstate.value) {
                        myState = event.request.intent.slots.usstate.value;
                        // call external rest service over https post
                        var post_data = {"usstate": myState};  

                        var post_options = { 
                            host:  'rmwum5l4zc.execute-api.us-east-1.amazonaws.com', 
                            port: '443', 
                            path: '/prod/stateresource', 
                            method: 'POST', 
                            headers: { 
                                'Content-Type': 'application/json', 
                                'Content-Length': Buffer.byteLength(JSON.stringify(post_data)) 
                            } 
                        };
                        var post_req = https.request(post_options, function(res) { 
                            res.setEncoding('utf8'); 
                            var returnData = ""; 
                            res.on('data', function (chunk) { 
                                returnData += chunk; 
                            }); 
                            res.on('end', function () {
                                // returnData: {"usstate":"Delaware","attributes":[{"population":900000},{"rank":45}]}

                                pop = JSON.parse(returnData).attributes[0].population;

                                say = "The population of " + myState + " is " + pop;

                                // add the state to a session.attributes array
                                if (!sessionAttributes.requestList) {
                                    sessionAttributes.requestList = [];
                                }
                                sessionAttributes.requestList.push(myState);

                                // This line concludes the lambda call.  Move this line to within any asynchronous callbacks that return and use data.
                                context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });

                            }); 
                        });
                        post_req.write(JSON.stringify(post_data));
                        post_req.end();
                    }
                },

                cancel: function () {
                    say = "You asked for " + sessionAttributes.requestList.toString() + ". Thanks for playing!";
                    shouldEndSession = true;
                    context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession) });
                },

                help: function () {
                    say = "Just say the name of a U.S. State, such as Massachusetts or California."
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

                },

                help: function () {

                }
            }
            var intentStates = {};

            intentStates[intentName]();
        },

        test: function (intentName) {
            handlers = {
                stateRequest: function () {

                },

                cancel: function () {

                },

                help: function () {

                }
            }
            var intentStates = {};

            intentStates[intentName]();
        }
    };

    if (event.request.type === "LaunchRequest") {
        say = "Welcome to Quizlex. Would you like to test or learn?";
        //initialization
        var answerData = populateAnswers(questions),
            correctAnswers = answerData['correctAnswers'],
            questionChoices = answerData['choices'],
            score = 0,
            currentTestIndex = 0,
            currentLearnIndex = 0;

        session.attributes['questions'] = questions;
        session.attributes['correctAnswers'] = correctAnswers;
        session.attributes['questionChoices'] = questionChoices;
        session.attributes['score'] = score;
        session.attributes['currentTestIndex'] = currentTestIndex;
        session.attributes['currentLearnIndex'] = currentLearnIndex;

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

function populateAnswers(questions) {
    var GAME_LENGTH = questions.length;
    var choice_names = ['A', 'B', 'C', 'D'];
    var correct_answers = [];
    var currentChoices = [];
    var choices = [];
    var correct_answer = "";
    var answer_index;
    var currentTerm;

    function shuffle(a) {
        var j, x, i;
        for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    }

    for (var i = 0; i < GAME_LENGTH; i++) {
        currentTerm = questions[i]['term'];
        currentChoices.push(currentTerm);

        for (var i = 0; i < 3; i++) {
            choice_index = Math.floor(Math.random() * GAME_LENGTH);
            if (questions[choice_index]['term'] == currentTerm) {
                i--;
            } else {
                currentChoices.push(questions[choice_index]['term']);
            }
        }

        shuffle(currentChoices);

        correct_answer = choice_names[currentChoices.indexOf(currentTerm)]; //returns string value of correct choice index;

        choices.append(currentChoices);

        correct_answers.append(correct_answer);
    }  

    return {correctAnswers: correct_answers, choices: choices};
}

function isCorrect(givenAnswer, questionIndex) {
    if (givenAnswer === session.attributes.correct_answers[questionIndex]) {
        return true;
    } else {
        return false;
    }
}
