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
