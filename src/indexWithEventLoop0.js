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
                        var term = sessionAttributes['questions'][sessionAttributes['currentLearnIndex']];
                        say = term['term'] + ", " + term['definition'];
                        sessionAttributes['currentLearnIndex'] += 1;
                        if (sessionAttributes['currentLearnIndex'] == sessionAttributes['questions'].length) {
                            sessionAttributes['applicationState'] = menu;
                        }

                        context.succeed({sessionAttributes: sessionAttributes, response: buildSpeechletResponse(say, shouldEndSession)});
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
        say = "Welcome to Quizlex! You have " + questions.length + " sets to study. I've selected " + sets[0].name
        + " for you. Would you like to learn this set or move on to the next set?";

        //initialization
        var answerData = populateAnswers(questions),
            correctAnswers = answerData['correctAnswers'],
            questionChoices = answerData['choices'],
            score = 0,
            currentTestIndex = 0,
            currentLearnIndex = 0;

        sessionAttributes['questions'] = questions;
        sessionAttributes['correctAnswers'] = correctAnswers;
        sessionAttributes['questionChoices'] = questionChoices;
        sessionAttributes['score'] = score;
        sessionAttributes['currentTestIndex'] = currentTestIndex;
        sessionAttributes['currentLearnIndex'] = currentLearnIndex;
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
