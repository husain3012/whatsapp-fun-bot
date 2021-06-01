// const venom = require("venom-bot");
const _ = require("lodash");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

axios
  .get("https://quizapi.io/api/v1/questions", { params: { apiKey: process.env.QUIZAPI, limit: 1 } })
  .then((response) => {
    console.log(response.data);
    let id = response.data[0].id;
    let question = response.data[0].question;
    let options = "";
    Object.entries(response.data[0].answers).forEach(([key, value]) => {
      if (value) {
        options = options + key.split("_")[1] + ": " + value + "\n";
      }
    });
    let correctAnswers = [];

    let ans = Object.entries(response.data[0].correct_answers).forEach(([key, value]) => {
      if (value === "true") {
        correctAnswers.push(key.split("_")[1]);
      }
    });

    let sendQuestion = "/" + id + "/\n\n" + question + "\n\n" + options + "\n\n" + correctAnswers;
    console.log(sendQuestion);
  })
  .catch((err) => {
    console.log(err);
  });
