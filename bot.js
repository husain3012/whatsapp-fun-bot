// jshint esversion: 8
const venom = require("venom-bot");
const _ = require("lodash");
const fs = require("fs");
const mongoose = require("mongoose");

const truthFile = fs.readFileSync(__dirname + "/data/truths.txt").toString("utf-8");
const rTruthFile = fs.readFileSync(__dirname + "/data/truths-r.txt").toString("utf-8");
const dareFile = fs.readFileSync(__dirname + "/data/dares.txt").toString("utf-8");
const rDareFile = fs.readFileSync(__dirname + "/data/dares-r.txt").toString("utf-8");
const nhieFile = fs.readFileSync(__dirname + "/data/nhie.txt").toString("utf-8");
const rNhieFile = fs.readFileSync(__dirname + "/data/nhie-r.txt").toString("utf-8");

let truths = truthFile.split("\n");
let truthsR = rTruthFile.split("\n");
let dares = dareFile.split("\n");
let daresR = rDareFile.split("\n");
let nhie = nhieFile.split("\n");
let nhieR = rNhieFile.split("\n");


mongoose.connect('mongodb://localhost:27017/whatsappBot', {useNewUrlParser: true, useUnifiedTopology: true});

venom
  .create()
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    message.body = _.toLower(message.body);
    if (message.body.slice(0, 1) === ".") {
        console.log(message);
      let commands = message.body.slice(1).split(" ");
      pre = commands[0];
      attr = commands[1];
      switch (pre) {
        case "truth":
          sendReply(client, message, randomTruth(attr));
          break;
        case "dare":
          sendReply(client, message, randomDare(attr));
          break;
        case "nhie":
            sendReply(client, message, randomNhie(attr));
            break;
        case "help": sendReply(client, message, sendHelp());
        break;
            
      }
    }
  });
}

function sendReply(client, recvMsg, sentMsg) {
     client.reply(
        recvMsg.from,
        sentMsg,
        recvMsg.id
      ).catch((erro) => {
          console.error('Error when sending: ', erro); //return object error
      });
  }


function sendText(client, recvMsg, sentMsg) {
  client.sendText(recvMsg.from, sentMsg).catch((erro) => {
    console.error("Error when sending: ", erro); //return object error
  });
}

function sendHelp() {
  return "*.help*: Sends this message.\n*.truth*: Sends a truth question. Use _.truth r_ for R rated question.\n*.dare*: Sends a dare. Use _.dare r_ for R rated dare.\n*.nhie*: Sends a Never have i ever questoin.Use _.nhie r_ for R rated NHIE.";
}

function randomTruth(isR) {
  if (isR === "r") {
    return truthsR[Math.floor(Math.random() * truthsR.length)];
  } else {
    return truths[Math.floor(Math.random() * truths.length)];
  }
}

function randomDare(isR) {
  if (isR === "r") {
    return daresR[Math.floor(Math.random() * daresR.length)];
  } else {
    return dares[Math.floor(Math.random() * dares.length)];
  }
}


function randomNhie(isR) {

    if (isR === "r") {
        return "Never have I ever " + nhieR[Math.floor(Math.random() * nhieR.length)];
    } 
    else {
      return "Never have I ever " + nhie[Math.floor(Math.random() * nhie.length)];
    }
  }