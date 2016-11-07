// This code sample shows how to call and receive external rest service data, within your skill Lambda code.

// var AWS = require('aws-sdk');

"use strict";

var https = require('https');

var sets = [{
    name: "Animal sounds",
    terms: [
        {
            term: "dog",
            definition: "woof woof"
        },
        {
            term: "cat",
            definition: "meow meow"
        },
        {
            term: "cow",
            definition: "moo moo"
        },
        {
            term: "duck",
            definition: "quack quack"
        },
        {
            term: "bird",
            definition: "chirp chirp"
        }
    ]
}];

exports.handler = (event, context) => {
    var say = "";
    var shouldEndSession = false;
    var myState = "";
    var pop = 0;
    var rank = 0;
    var sessionAttributes = event.session.attributes || {};

    sessionAttributes.appState = sessionAttributes.appState || "menu";
    sessionAttributes.setNumber = sessionAttributes.setNumber || 1;

    var states = {
        menu: (intent, sessionAttributes) => {
            handlers = {
                changeSet: () => {
                    sessionAttributes.setNumber++;
                    
                    if (sessionAttributes.setNumber > sets.length) {
                        sessionAttributes.setNumber = 1;
                    }

                    say = "I've selected set " + sessionAttributes.setNumber + " " + 
                          sets[sessionAttributes.setNumber - 1].name + " for you. " + 
                          "Would you like to use this set or move on to the next set?";

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                },

                changeState: () => {

                    sessionAttributes.appState = intent.slots.changestate.value || "menu";
                    if (sessionAttributes.appState === "learn") {
                        say = "Prepare to learn " + 
                              sets[sessionAttributes.setNumber - 1].name;
                    } else if (sessionAttributes.appState == "test") {
                        say = "I will now test you on " + 
                              sets[sessionAttributes.setNumber - 1].name;
                    }
                    
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                },

                cancel: () => {
                    say = "Exiting application. Goodbye!";
                    shouldEndSession = true;
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                },

                help: () => {
                    say = "Would you like to learn this set or move on to the next set?";
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                }
            }

            var iStates = {}
            iStates.IterateIntent = handlers.changeSet;
            iStates.ChangeStateIntent = handlers.changeState;
            iStates["AMAZON.StopIntent"] = iStates["AMAZON.CancelIntent"] = handlers.cancel;
            iStates["AMAZON.HelpIntent"] = handlers.help;

            iStates[intent.name]();
        },

        learn: (intent, sessionAttributes) => {
            handlers = {
                continue: () => {
                    var term = sessionAttributes['questions'][sessionAttributes['currentLearnIndex']];
                    say = term['term'] + ", " + term['definition'];
                    sessionAttributes['currentLearnIndex'] += 1;

                    if (sessionAttributes['currentLearnIndex'] == sessionAttributes['questions'].length) {  
                        sessionAttributes['appState'] = 'menu';
                    }

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession)
                    });
                },

                cancel: () => {
                    say = "Exiting to menu";
                    sessionAttributes.appState = "menu"
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                },

                help: () => {
                    say = "Say next to continue or exit to return to the menu";
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                }
            }

            var iStates = {}
            iStates.IterateIntent = handlers.continue;
            iStates["AMAZON.StopIntent"] = iStates["AMAZON.CancelIntent"] = handlers.cancel;
            iStates["AMAZON.HelpIntent"] = handlers.help;

            iStates[intent.name]();
        },

        test: (intent, sessionAttributes) => {
            say = "";

            handlers = {
                initializeTest: () => {
                    var currentQuestion = sessionAttributes['currentTestIndex'];
                    var definition = sessionAttributes['questions'][currentQuestion]['definition'];
                    
                    var choices = "A: " + sessionAttributes.questionChoices[currentQuestion][0] + " " +
                                  "B: " + sessionAttributes.questionChoices[currentQuestion][1] + " " + 
                                  "C: " + sessionAttributes.questionChoices[currentQuestion][2] + " " + 
                                  "D: " + sessionAttributes.questionChoices[currentQuestion][3];


                    say = definition + " " + choices;

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession)
                    });
                },

                answer: () => {
                    var currentQuestion = sessionAttributes['currentTestIndex'];

                    if (isCorrect(intent.slots.options.value, sessionAttributes.correctAnswers[currentQuestion])) {
                        say = "That is correct.";
                        sessionAttributes['score'] += 1;
                    } else {
                        say = "That is incorrect. The correct answer was " 
                              + sessionAttributes['questions'][currentQuestion]['term'];
                    }

                    sessionAttributes['currentTestIndex'] += 1;

                    if (sessionAttributes['currentTestIndex'] == sessionAttributes['questions'].length) {
                        sessionAttributes['appState'] = 'menu';
                        say += " You got " + sessionAttributes.score + " out of " + 
                              sessionAttributes['questions'].length + " questions correct.";
                    }

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession)
                    });
                },

                dunno: () => {
                    var currentQuestion = sessionAttributes['currentTestIndex'];

                    say = "The correct answer was " +
                          sessionAttributes['questions'][currentQuestion]['term'];

                    sessionAttributes['currentTestIndex'] += 1;

                    if (sessionAttributes['currentTestIndex'] == sessionAttributes['questions'].length) {
                        sessionAttributes['appState'] = 'menu';
                        say += " You got " + sessionAttributes.score + " out of " + 
                              sessionAttributes['questions'].length + " questions correct.";
                    }

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession)
                    });
                },

                cancel: () => {
                    say = "You got " + sessionAttributes.score + " out of " + 
                          (sessionAttributes['currentTestIndex'] + 1) + 
                          " questions correct.";

                    shouldEndSession = true;

                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                },

                help: () => {
                    say = "";
                    context.succeed({
                        sessionAttributes: sessionAttributes, 
                        response: buildSpeechletResponse(say, shouldEndSession) 
                    });
                }
            }

            var iStates = {}
            iStates.IterateIntent = handlers.initializeTest;
            iStates.AnswerIntent = handlers.answer;
            iStates["AMAZON.StopIntent"] = iStates["AMAZON.CancelIntent"] = handlers.cancel;
            iStates["AMAZON.HelpIntent"] = handlers.help;

            iStates[intent.name]();
        }
    };

    if (event.request.type === "LaunchRequest") {
        say = "Welcome to Quizlex! You have " + sets.length + 
              " sets to study. I've selected " + sets[0].name +
              " for you. Would you like to learn this set or move " + 
              "on to the next set?";

        //initialization
        var answerData = populateAnswers(sets[0].terms),
            correctAnswers = answerData['correctAnswers'],
            questionChoices = answerData['choices'],
            score = 0,
            currentTestIndex = 0,
            currentLearnIndex = 0;

        sessionAttributes.questions = sets[0].terms;
        sessionAttributes.correctAnswers = correctAnswers;
        sessionAttributes.questionChoices = questionChoices;
        sessionAttributes.score = score;
        sessionAttributes.currentTestIndex = currentTestIndex;
        sessionAttributes.currentLearnIndex = currentLearnIndex;
        sessionAttributes.appState = "menu";

        context.succeed({
            sessionAttributes: sessionAttributes, 
            response: buildSpeechletResponse(say, shouldEndSession) 
        });

    } else {
        states[sessionAttributes.appState](event.request.intent, sessionAttributes);
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

        for (var j = 0; j < 3; j++) {
            choice_index = Math.floor(Math.random() * GAME_LENGTH);
            if (questions[choice_index]['term'] == currentTerm) {
                j--;
            } else {
                currentChoices.push(questions[choice_index]['term']);
            }
        }

        shuffle(currentChoices);

        correct_answer = choice_names[currentChoices.indexOf(currentTerm)]; //returns string value of correct choice index;

        choices.push(currentChoices);
        currentChoices = [];
        correct_answers.push(correct_answer);
    }

    return {correctAnswers: correct_answers, choices: choices};
}

function isCorrect(givenAnswer, correctAnswer) {
    if (givenAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
        return true;
    } else {
        return false;
    }
}
