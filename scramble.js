const venom = require("venom-bot");
const _ = require("lodash");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");
let today = new Date();

let categories = [
  ["vehicles", 28],
  ["vdeogames", 15],
  ["gk", 9],
  ["math", 19],
  ["movies", 11],
  ["cs", 18],
  ["tech", 30],
  ["any", null],
];
axios
  .get("https://opentdb.com/api.php?amount=1", {
    params: { category: categories[Math.floor(Math.random() * categories.length)][1], amount: 1, encode: "base64" },
  })
  .then((response) => {

    // console.log(response.data);
    let id = today.getTime() % 1000000000;
    let optionsArray = response.data.results[0].incorrect_answers;
    let difficulty = _.toLower(b64toString(response.data.results[0].difficulty))
    optionsArray.push(response.data.results[0].correct_answer);
    optionsArray = _.shuffle(optionsArray);
    let correctAnswers = [];
    let options = "";

    optionsArray.forEach((item, index) => {
      let choice = String.fromCharCode(97 + index);
      if (item === response.data.results[0].correct_answer) {
        correctAnswers.push(choice);
      }
      options += choice + ": " + b64toString(item) + "\n";
    });
    let question = b64toString(response.data.results[0].question);

    let sendQuestion = "/" + id + "/   _"+difficulty+"_\n\n Q: " + question + "\n\n" + options;

    let ques = new Ques({
      _id: id,
      question: question,
      answers: correctAnswers,
      difficulty: difficulty

    });
    ques.save();
 
    sendText(client, message, sendQuestion);
    console.log(sendQuestion);
    console.group(correctAnswers)
  })
  .catch((err) => {
    console.log(err);
  });

  function b64toString(data){
    return Buffer.from(data, 'base64').toString('ascii');
  }
