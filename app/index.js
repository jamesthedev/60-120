import document from "document";
import vibration from "haptics";
import fs from "fs";
import me from "appbit";
import display from "display";
import exercise from "exercise";

//prevent app from closing
me.appTimeoutEnabled = false;

//get DOM elements
var highScore = document.getElementById("highScore");
var btn3060 = document.getElementById("btn3060");
var btn60120 = document.getElementById("btn60120");
var defaultView = document.getElementById("selectorUI");
var counterView = document.getElementById("counterUI");
var summaryView = document.getElementById("summaryUI");
var counterTxt = document.getElementById("counter");
var currStage = document.getElementById("currStage");
var iterationTxt = document.getElementById("iterations");
var pauseBtn = document.getElementById("pauseBtn");
var resumeBtn = document.getElementById("resumeBtn");
var finishBtn = document.getElementById("finishBtn");

var firstStageVal, secondStageVal, thisHighScore;

//get high score or set it if it doesn't exist
var highScoreVal3060, highScoreVal60120, highScores;
try {
    highScores = fs.readFileSync("hs.txt", "ascii");
    highScores = JSON.parse(highScores);
    highScoreVal3060 = highScores._3060;
    highScoreVal60120 = highScores._60120;
}

catch (e) {
    var newHighScores = {
        _3060: 0,
        _60120: 0
    };

    fs.writeFileSync("hs.txt", newHighScores, "json");
    highScoreVal3060 = highScoreVal60120 = 0;
}

//display & animate high score
highScore.text = " 30-60 High Score: " + highScoreVal3060 + " || 60-120 High Score: " + highScoreVal60120 + " ||";
highScore.state = "enabled";

//initial screen event handlers 
btn3060.onactivate = function () {
    firstStageVal = 30;
    secondStageVal = 60;
    thisHighScore = highScoreVal3060;

    main();
}

btn60120.onactivate = function () {
    firstStageVal = 60;
    secondStageVal = 120;
    thisHighScore = highScoreVal60120;

    main();
}

function main() {
    //start tracking exercise if permissions exist    
    if (me.permissions.granted("access_location") && me.permissions.granted("access_activity")) {
        exercise.start("run", { gps: true });
    }

    else if (me.permissions.granted("access_activity")) {
        exercise.start("run");
    }

    //switch views 
    defaultView.style.display = "none";
    counterView.style.display = "";
    currStage.text = firstStageVal;

    //set default values 
    var timer = 1;
    var iterations = 0;
    var inFirstStage = true;
    var inSecondStage = false;
    var active = true;

    //pause button
    pauseBtn.onactivate = function (evt) {
        if (me.permissions.granted("access_activity")) {
            exercise.pause();
        }

        counterTxt.style.fill = "gray";
        active = false;

        pauseBtn.style.display = "none";
        resumeBtn.style.display = "";
        finishBtn.style.display = "";
    }

    //resume button
    resumeBtn.onactivate = function () {
        if (me.permissions.granted("access_activity")) {
            exercise.resume();
        }

        counterTxt.style.fill = "green";
        active = true;

        pauseBtn.style.display = "";
        resumeBtn.style.display = "none";
        finishBtn.style.display = "none";
    }

    //finish button 
    finishBtn.onactivate = function () {
        if (me.permissions.granted("access_activity")) {
            exercise.stop();
        }

        counterView.style.display = "none";
        summaryView.style.display = "";

        populateFinalStats(iterations);
    }

    function iterate() {
        if (active === true) {
            //end of stage 1
            if (inFirstStage === true && timer === firstStageVal) {
                timer = 1;
                inFirstStage = false;
                inSecondStage = true;

                currStage.text = secondStageVal;

                display.on = true;
                vibration.start("nudge-max");
                vibration.stop();
            }

            //end of stage 2
            else if (inSecondStage === true && timer === secondStageVal) {
                timer = 1;
                inFirstStage = true;
                inSecondStage = false;
                ++iterations;

                //update high score 
                if (iterations > thisHighScore) {
                    try {
                        updateHighScores(iterations);
                        iterationTxt.style.fill = "lightgreen";
                    }

                    catch (e) {
                        console.log(e);
                    }
                }

                currStage.text = firstStageVal;
                iterationTxt.text = "Iterations: " + iterations;

                display.on = true;
                vibration.start("nudge-max");
                vibration.stop();
            }

            //update display 
            ++timer;
            counterTxt.text = timer;
        }
    }

    setInterval(iterate, 1000);
}

var highScore = false;
function updateHighScores(newVal) {
    var newHighScores;
    highScore = true;

    //30-60 mode
    if (firstStageVal == "30") {
        newHighScores = {
            _3060: newVal,
            _60120: highScoreVal60120
        };
    }

    //60-120 mode
    else {
        newHighScores = {
            _3060: highScoreVal3060,
            _60120: newVal
        };
    }

    fs.writeFileSync("hs.txt", newHighScores, "json");
}

function populateFinalStats(finalIterations) {
    summaryView.style.display = "";
    var headerTxt = document.getElementById("headerTxt");
    var footerTxt = document.getElementById("footerTxt");
    var startOverBtn = document.getElementById("startOverBtn");

    var header, footer;

    if (finalIterations == 0) {
        header = "Good start! Try to complete a full iteration for an even better workout. ";
    }

    else {
        header = "Nice work! You completed " + finalIterations + (finalIterations == 1 ? " iteration. " : " iterations. ");

        if (highScore) {
            header += "You beat your previous high score! ";
        }
    }

    //only shows this message if there is data to be viewed. if the user has opted to not share activity data,
    //there is no need to refer them to the app.
    if (me.permissions.granted("access_activity")) {
        footer = "Check the companion app for more details about this workout.";
    }

    headerTxt.text = header;
    footerTxt.text = footer;
}