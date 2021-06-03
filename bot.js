// jshint esversion: 8
const venom = require("venom-bot");
const _ = require("lodash");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");

require("dotenv").config();

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
mongoose.connect("mongodb://localhost:27017/whatsappBot", { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
  noID: String,
  name: String,
  adult: Boolean,
  score: Number,
});
const quizSchema = new mongoose.Schema({
  _id: Number,
  question: String,
  answers: Array,
  difficulty: String,
});

const Ques = mongoose.model("question", quizSchema);
const User = mongoose.model("user", userSchema);
Ques.deleteMany({}, function () {
  console.log("questions db cleared");
});
let makeStickerTries = 0;
let gifStickerTry = 0;
let userLastCommand;
// let lookingForAnswer = false;

// Variables:
let preprocessor = ".";
let autoResponseEnabled = true;
let adultPassword = process.env.ADULTPW;
let rapidApiKey = process.env.COINGECKOKEY;
venom
  .create()
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    createOrFindUser(message);

    if (
      message.quotedParticipant === "917017919847@c.us" &&
      ["a", "b", "c", "d", "e", "f"].includes(_.toLower(message.body))
    ) {
      checkAnswerToQuiz(client, message);
    }
    message.body = _.toLower(message.body);
    if (autoResponseEnabled) {
      autoResponse(client, message);
    }

    if (message.body.slice(0, 1) === preprocessor) {
      // console.log(recvMsg.chat.name)
      let commands = message.body.slice(1).split(" ");
      let supportedCommands = [
        "truth",
        "dare",
        "nhie",
        "roast",
        "sticker",
        "meme",
        "adult",
        "horny",
        "gimme",
        "make",
        "help",
      ];

      pre = commands[0];
      attr = commands[1];
      query = splitAtFirstSpace(message.body.slice(1))[1];
      switch (pre) {
        case "truth":
          if (message.isGroupMsg) {
            sendReply(client, message, randomTruth(attr));
          } else {
            sendText(client, message, randomTruth(attr));
          }

          break;
        case "dare":
          if (message.isGroupMsg) {
            sendReply(client, message, randomDare(attr));
          } else {
            sendText(client, message, randomDare(attr));
          }
          break;
        case "nhie":
          if (message.isGroupMsg) {
            sendReply(client, message, randomNhie(attr));
          } else {
            sendText(client, message, randomNhie(attr));
          }
          break;
        case "roast":
          sendInsult(client, message, attr);
          break;
        case "sticker":
          sendGifAsSticker(client, message, query);
          break;
        case "meme":
          sendRedditMeme(client, message, attr);
          break;
        case "adult":
          makeUserAdult(client, message, attr);
          break;
        case "horny":
          sendHorny(client, message, attr);
          break;
        case "gimme":
          sendReddit(client, message, query);
          break;
        case "quiz":
        
          let rand = Math.ceil(Math.random()*5);
          if(rand%2===0){
            quizRandom(client, message);
          }else if(rand===1){
            quizCS(client, message)
          }
          else{
            randomQuesBank(client, message)
          }

          break;
        case "score":
          getScore(client, message);
          break;
        case "rank":
          getRank(client, message);
          break;
        case "stonk":
          getCrypto(client, message, attr);
          break;
        case "make":
          if (Math.floor(Math.random() * 2)) {
            makeSticker(client, message, query);
          } else {
            makeGif(client, message, query);
          }

          break;
        case "scramble":
          // scrambleGame(client, message, false);
          break;
        case "test":
          sendGiphy(client, message, query);
          break;
        case "gali":
          console.log("calling gali");
          sendGali(client, message);

          break;
        case "help":
          sendHelp(client, message);
          break;
        default:
      }
    }
  });
}

function splitAtFirstSpace(str) {
  if (!str) return [];
  var i = str.indexOf(" ");
  if (i > 0) {
    return [str.substring(0, i), str.substring(i + 1)];
  } else return [str];
}

function sendReply(client, recvMsg, sentMsg) {
  client.reply(recvMsg.from, sentMsg, recvMsg.id).catch((erro) => {
    console.error("Error when sending: ", erro); //return object error
  });
}

function sendText(client, recvMsg, sentMsg) {
  client.sendText(recvMsg.from, sentMsg).catch((erro) => {
    console.error("Error when sending: ", erro); //return object error
  });
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
  } else {
    return "Never have I ever " + nhie[Math.floor(Math.random() * nhie.length)];
  }
}

function createOrFindUser(userInfo) {
  User.findOne({ noID: userInfo.sender.id }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (!foundUser) {
        console.log("Creating new user: " + userInfo.sender.pushname);
        let person = new User({
          noID: userInfo.sender.id,
          name: userInfo.sender.pushname,
          adult: false,
          score: 0,
        });
        person.save();
      } else {
      }
    }
  });
}

function sendInsult(client, message, attr) {
  let random = Math.floor(Math.random() * 2);
  if (random) {
    axios
      .get("https://insult.mattbas.org/api/insult.json", { params: { who: attr } })
      .then((response) => {
        return response.data.insult;
      })
      .then((insult) => {
        if (message.isGroupMsg) {
          sendReply(client, message, insult);
        } else {
          sendText(client, message, insult);
        }
      });
  } else {
    axios
      .get("https://evilinsult.com/generate_insult.php?lang=en&type=json")
      .then((response) => {
        return response.data.insult;
      })
      .then((insult) => {
        if (message.isGroupMsg) {
          sendReply(client, message, "Dear " + attr + ", " + insult);
        } else {
          sendText(client, message, "Dear " + attr + ", " + insult);
        }
      });
  }
}

function sendFile(client, message, file, caption) {
  if (caption === undefined) {
    caption = "";
  }
  client
    .sendFile(message.from, file, "file_name", caption)
    .then((result) => {
      console.log("Result: ", result); //return object success
    })
    .catch((erro) => {
      console.error("Error when sending: ", erro); //return object error
    });
}

function sendGifAsSticker(client, recvMsg, query) {
  gifStickerTry += 1;
  if (attr === undefined) {
    attr = "What you want";
  }
  console.log(attr);
  axios
    .get("https://api.giphy.com/v1/stickers/search", { params: { api_key: process.env.GIPHYKEY, q: query } })
    .then((response) => {
      let rand = Math.floor(Math.random() * response.data.data.length);
      let gif = response.data.data[rand];
      let gifurl = gif.images.original.url;
      client
        .sendImageAsStickerGif(recvMsg.from, gifurl)
        .then((result) => {
          console.log("Result: ", result); //return object success
          gifStickerTry = 0;
        })
        .catch((erro) => {
          console.error(", Trying again, Error when sending: ", erro); //return object error
          if (gifStickerTry < 3) {
            sendGifAsSticker(client, recvMsg, query);
          }
        });
    });
}

function makeGif(client, recvMsg, query) {
  makeStickerTries += 1;
  let howWeird = Math.floor(Math.random() * 11);

  axios
    .get("https://api.giphy.com/v1/gifs/translate", {
      params: { api_key: process.env.GIPHYKEY, s: query, weirdness: howWeird },
    })
    .then((response) => {
      if (response.status === 200) {
        try {
          let gifurl = response.data.data.images.original.mp4;
          console.log(gifurl);
          client
            .sendFile(recvMsg.from, gifurl)
            .then((result) => {
              console.log("Result: ", result); //return object success
              makeStickerTries = 0;
            })
            .catch((erro) => {
              console.error(", Trying again, Error when sending: ", erro); //return object error
              if (makeStickerTries < 3) {
                makeGif(client, recvMsg, query);
              }
            });
        } catch (err) {
          console.log(err);
        }
      }
    });
}
function makeSticker(client, recvMsg, query) {
  makeStickerTries += 1;
  let howWeird = Math.floor(Math.random() * 11);

  axios
    .get("https://api.giphy.com/v1/gifs/translate", {
      params: { api_key: process.env.GIPHYKEY, s: query, weirdness: howWeird },
    })
    .then((response) => {
      if (response.status === 200) {
        let gifurl = response.data.data.images.fixed_height_downsampled.url;
        console.log(gifurl);
        client
          .sendImageAsStickerGif(recvMsg.from, gifurl)
          .then((result) => {
            console.log("Result: ", result); //return object success
            makeStickerTries = 0;
          })
          .catch((erro) => {
            console.error(", Trying again, Error when sending: ", erro); //return object error
            if (makeStickerTries < 3) {
              makeSticker(client, recvMsg, query);
            }
          });
      }
    });
}

function sendImage(client, recvMsg, sentMsg, caption) {
  console.log("sendding image");
  if (caption === undefined) {
    caption = "";
  }
  client
    .sendImage(recvMsg.from, sentMsg, "image", caption)
    .then((result) => {
      console.log("Result: ", result); //return object success
    })
    .catch((erro) => {
      console.error("Error when sending: ", erro); //return object error
    });
}

function sendImageAsSticker(client, recvcMsg, img) {
  client
    .sendImageAsSticker(recvcMsg.from, img)
    .then((result) => {
      console.log("Result: ", result); //return object success
    })
    .catch((erro) => {
      console.error("Error when sending: ", erro); //return object error
    });
}

function sendGiphy(client, message, query) {
  axios
    .get("https://api.giphy.com/v1/gifs/search", { params: { api_key: process.env.GIPHYKEY, q: query } })
    .then((response) => {
      let rand = Math.floor(Math.random() * response.data.data.length);
      let gif = response.data.data[rand];
      let gifVidUrl = gif.images.original.mp4;
      sendFile(client, message, gifVidUrl);
    })
    .catch((error) => {
      console.log(error);
    });
}

function sendRedditMeme(client, recvMsg, attr) {
  console.log("reqeust meme");
  if (attr === "r") {
    sendHorny(client, recvMsg, "NSFWFunny");
  } else {
    let memeSource = ["memes", "funny"];
    if (recvMsg.isGroupMsg) {
      console.log("checking group");
      let group_name = _.toLower(recvMsg.chat.name);
      let group_desc = _.toLower(recvMsg.chat.groupMetadata.desc);
      if (group_desc.includes("game") || group_name.includes("game")) {
        memeSource = ["gamingmemes"];
      } else if (group_desc.includes("code") || group_name.includes("cse") || group_name.includes("coding")) {
        memeSource = ["ProgrammerHumor"];
      }
    }
    let meme = memeSource[Math.floor(Math.random() * memeSource.length)];
    console.log("Searching for meme " + meme);
    axios.get("https://meme-api.herokuapp.com/gimme/" + meme).then((response) => {
      if (response.status === 200) {
        let json = response.data;
        console.log("meme found");
        let title = json.title;
        let img = json.url;
        sendImage(client, recvMsg, img, title);
      }
    });
  }
}

function makeUserAdult(client, user, attr) {
  console.log(attr);
  console.log(user.isGroupMsg);
  if (attr === adultPassword) {
    User.findOneAndUpdate({ noID: user.sender.id }, { $set: { adult: true } }, function (err) {
      if (err) {
        console.log(err);
      } else {
        sendReply(client, user, "You are an adult now.");
      }
    });
  }
}

function sendHorny(client, recvMsg, attr) {
  if (!recvMsg.isGroupMsg || recvMsg.chat.groupMetadata.id === "918755615361-1610041147@g.us") {
    nsfwSubreddits = ["gooned", "gonewild", "boobs", "cumsluts", "blowjob", "nsfwhardcore"];
    if (attr === undefined) {
      attr = nsfwSubreddits[Math.floor(Math.random() * nsfwSubreddits.length)];
    }
    User.findOne({ noID: recvMsg.sender.id }, function (err, foundUser) {
      if (foundUser) {
        if (foundUser.adult) {
          axios.get("https://meme-api.herokuapp.com/gimme/" + attr).then((result) => {
            if (result.data.code === 404) {
              sendReply(client, recvMsg, "Try again");
            } else if (result.status === 200) {
              let image = result.data.url;
              let title = result.data.title;
              console.log(image);
              sendImage(client, recvMsg, image, title);
            }
          });
        }
      }
    });
  }
}

function sendReddit(client, recvMsg, query) {
  axios
    .get("https://meme-api.herokuapp.com/gimme/" + _.camelCase(query))
    .then((response) => {
      if (response.status === 200) {
        console.log(response.status + "page loaded");
        let json = response.data;

        let title = json.title;
        let img = json.url;
        if (json.nsfw) {
          sendGiphy(client, recvMsg, query);
        } else {
          if (json.ups > 100) {
            console.log("good subreddit found");
            sendImage(client, recvMsg, img, title);
          } else {
            console.log("redirecting to giphy");
            sendGiphy(client, recvMsg, query);
          }
        }
      } else {
        console.log(response.status);
      }
    })
    .catch((e) => {
      console.log(e);
      console.log("redirecting to giphy");
      sendGiphy(client, recvMsg, query);
    });
}

function scrambleGame(client, message, answer) {
  let original_word = "animal";

  if (!answer) {
    let scrambled_word = original_word.shuffle();
    sendText(client, message, scrambled_word);
  } else {
    if (message.hasOwnProperty("quotedParticipant")) {
      console.log("checkongscramble answer");
      if (message.quotedParticipent === "917017919847@c.us") {
        if (message.quotedMsg.body === scrambled_word && answer === original_word) {
          sendReply(client, message, "Good Work");
        } else {
          sendReply(client, message, "Try again");
        }
      }
    }
  }
}

function autoResponse(client, message) {
  let fuck = ["fuck you", "fuck off", "fo", "fu"];
  let sarfiLottery = "Congrats, you got 1500 bucks";
  if (fuck.includes(_.toLower(message.body)) && !message.isGroupMsg) {
    User.findOne({ noID: message.sender.id }, function (err, foundUser) {
      if (foundUser) {
        if (foundUser.adult) {
          sendReply(client, message, "Fuck You Too!");
          sendImageAsSticker(client, message, __dirname + "/data/images/fuck" + Math.ceil(Math.random() * 5) + ".jpg");
        } else {
          console.log(foundUser);
        }
      }
    });
  }
}

function random(mul) {
  return Math.floor(Math.random() * mul);
}
function sendGali(client, message) {
  let maleNouns = ["lund", "hath", "chodha"];

  let femaleNouns = ["gand", "chut", "bhosdi", "randi", "tatti", "chipkali"];

  let neutralNouns = ["tatte", "chutad", "baal"];

  let adjective = ["chutiya", "haggu"];
  let verb = ["mar", "chodh", "baja"];

  let nouns = [maleNouns, femaleNouns, neutralNouns];
  let noun1, noun2, conjection;
  let randNoun1 = random(3);
  let randNoun2 = random(3);
  console.log("generating gali");

  while (noun1 === noun2) {
    if (randNoun1 === 0) {
      noun1 = maleNouns[random(maleNouns.length)];
    } else if (randNoun1 === 1) {
      noun1 = femaleNouns[random(femaleNouns.length)];
    } else {
      noun1 = neutralNouns[random(neutralNouns.length)];
    }

    if (randNoun2 === 0) {
      noun2 = maleNouns[random(maleNouns.length)];
      conjection = "ka";
    } else if (randNoun2 === 1) {
      noun2 = femaleNouns[random(femaleNouns.length)];
      conjection = "ki";
    } else {
      noun2 = neutralNouns[random(neutralNouns.length)];
      conjection = "ke";
    }
  }

  console.log("gali genreated");

  let gali = noun1 + " " + conjection + " " + noun2;
  if (!message.isGroupMsg || message.chat.groupMetadata.id === "918755615361-1610041147@g.us") {
    console.log("sending gali");
    sendReply(client, message, gali);
  }
}

function quizCS(client, message) {
  let categories = ["linux", "bash", "docker", "sql"];
  axios
    .get("https://quizapi.io/api/v1/questions", { params: { apiKey: process.env.QUIZAPI, limit: 1 } })
    .then((response) => {
      // console.log(response.data);
      let id = response.data[0].id;
      let question = response.data[0].question;
      let options = "";
      let difficulty = _.toLower(response.data[0].difficulty);
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

      let sendQuestion = "/" + id + "/   _" + difficulty + "_\n\n Q: " + question + "\n\n" + options;
      let ques = new Ques({
        _id: id,
        question: question,
        answers: correctAnswers,
        difficulty: difficulty,
      });
      ques.save();
      // lookingForAnswer = true;
      sendText(client, message, sendQuestion);
    })
    .catch((err) => {
      console.log(err);
    });
}

function randomQuesBank(client, message) {
  axios
    .get("https://trivia.willfry.co.uk/api/questions?limit=1")
    .then((respone) => {
      if (respone.status === 200) {
        let id = today.getTime() % 1000000000;
        let optionsArray = response.data[0].incorrectAnswers;
        optionsArray.push(respone.data[0].correctAnswer);
        let difficulty = "medium";
        let correctAnswers = [];
        let options = "";
        optionsArray = _.shuffle(optionsArray);
        optionsArray.forEach((item, index) => {
          let choice = String.fromCharCode(97 + index);
          if (item === respone.data[0].correctAnswer) {
            correctAnswers.push(choice);
          }
          options += choice + ": " + item + "\n";
        });
        let question = response.data[0].question;
        let sendQuestion = "/" + id + "/   _" + difficulty + "_\n\n Q: " + question + "\n\n" + options;

        let ques = new Ques({
          _id: id,
          question: question,
          answers: correctAnswers,
          difficulty: difficulty,
        });
        ques.save();

        sendText(client, message, sendQuestion);
        console.log(sendQuestion);
        console.group(correctAnswers);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function quizRandom(client, message) {
  let today = new Date();
  let categories = [
    ["vehicles", 28],
    ["vdeogames", 15],
    ["gk", 9],
    ["math", 19],
    ["movies", 11],
    ["cs", 18],
    ["tech", 30],
    ["sports", 21],
    ["tv", 14],
    ["anime", 31],
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
      let difficulty = _.toLower(b64toString(response.data.results[0].difficulty));
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

      let sendQuestion = "/" + id + "/   _" + difficulty + "_\n\n Q: " + question + "\n\n" + options;

      let ques = new Ques({
        _id: id,
        question: question,
        answers: correctAnswers,
        difficulty: difficulty,
      });
      ques.save();

      sendText(client, message, sendQuestion);
      console.log(sendQuestion);
      console.group(correctAnswers);
    })
    .catch((err) => {
      console.log(err);
    });
}
function b64toString(data) {
  return Buffer.from(data, "base64").toString("ascii");
}

function checkAnswerToQuiz(client, message) {
  let user;
  if (message.isGroupMsg) {
    user = message.author;
  } else {
    user = message.from;
  }
  let id = parseInt(message.quotedMsg.body.split("/")[1]);
  console.log("Looking for ques: " + id);
  let inputAns = _.toLower(message.body);
  Ques.findOne({ _id: id }, function (err, foundQues) {
    if (!err && foundQues) {
      let gain = 0;
      switch (foundQues.difficulty) {
        case "easy":
          gain = 10;
          break;
        case "medium":
          gain = 14;
          break;
        case "hard":
          gain = 20;
          break;
        default:
          gain = 10;
      }
      if (foundQues.answers.includes(inputAns)) {
        sendReply(client, message, "Good Work, you got " + gain + " points");
        gainPoints(user, gain);
        Ques.deleteOne({ _id: id }, function (err) {
          console.log(err);
        });
        // lookingForAnswer = false;
      } else {
        sendReply(client, message, "Ow, You lost " + gain / 2 + " points, try again!");
        gainPoints(user, gain / 2);
        console.log(inputAns + foundQues.answers);
      }
    } else {
      console.log(err);
    }
  });
}

function gainPoints(user, points) {
  User.findOne({ noID: user }, function (err, foundUser) {
    if (!err) {
      console.log(foundUser);

      let newScore;

      newScore = foundUser.score + points;

      console.log("updating score");

      User.findOneAndUpdate({ noID: user }, { $set: { score: newScore } }, function (e) {
        console.log(e);
      });
    } else {
      console.log("err: " + err);
    }
  });
}

function getScore(client, message) {
  console.log(message);
  let user;
  if (message.isGroupMsg) {
    user = message.author;
  } else {
    user = message.from;
  }
  User.findOne({ noID: user }, function (err, foundUser) {
    sendReply(client, message, "Your current score is " + foundUser.score);
  });
}

function getRank(client, message) {
  User.find({})
    .sort("-score")
    .exec(function (err, docs) {
      let topFive = "";
      for (let i = 0; i < 5; i++) {
        topFive += docs[i].name + ": " + docs[i].score + "\n";
      }
      sendText(client, message, topFive);
    });
}

function sendHelp(client, user) {
  let help = `*${preprocessor}help*: Sends this message.\n\n*${preprocessor}truth*: Sends a truth question.\n\n*${preprocessor}dare*: Sends a dare.\n\n*${preprocessor}nhie*: Sends a Never have i ever questoin.\n\n*${preprocessor}roast <name>*: Roasts entered user.\n\n*${preprocessor}meme*: Sends a fresh meme from r/memes.\n\n*${preprocessor}gimme <search>*: Sends a relatable image from a matching subreddit. Example: ${preprocessor}gimme PuppySmiles\n\n*${preprocessor}sticker <search>*: Sends a relatble sticker. Example: ${preprocessor}sticker Thank You\n\n*${preprocessor}make <name>*: Sends a gif or sticker generated by matching the query. Example: .make ryan gosling`;
  let helpAdult = `*${preprocessor}help*: Sends this message.\n\n*${preprocessor}truth*: Sends a truth question. Use _${preprocessor}truth r_ for adult questions.\n\n*${preprocessor}dare*: Sends a dare. Use _${preprocessor}dare r_ for adult dares.\n\n*${preprocessor}nhie*: Sends a Never have i ever questoin. Use _${preprocessor}nhie r_ for adult questions.\n\n*${preprocessor}roast <name>*: Roasts entered user.\n\n*${preprocessor}meme*: Sends a fresh meme from r/memes. Use _${preprocessor}meme r_ for adult memes.\n\n*${preprocessor}gimme <search>*: Sends a relatable image from a matching subreddit. Example: ${preprocessor}gimme PuppySmiles\n\n*${preprocessor}sticker <search>*: Sends a relatble sticker. Example: ${preprocessor}sticker Thank You\n\n*${preprocessor}make <name>*: Sends a gif or sticker generated by matching the query. Example: .make ryan gosling\n\n*${preprocessor}horny <search>*: Supports NSFW images. Example: _${preprocessor}horny butt_`;
  User.findOne({ noID: user.sender.id }, function (err, foundUser) {
    if (foundUser) {
      if (foundUser.adult && !user.isGroupMsg) {
        sendText(client, user, helpAdult);
      } else {
        sendText(client, user, help);
      }
    }
  });
}

function getCrypto(client, message, attr) {
  const options = {
    method: "GET",
    url: "https://coingecko.p.rapidapi.com/coins/" + attr,
    params: {
      localization: "true",
      tickers: "true",
      market_data: "true",
      community_data: "true",
      developer_data: "true",
      sparkline: "false",
    },
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": "coingecko.p.rapidapi.com",
    },
  };
  axios
    .request(options)
    .then(function (response) {
      if (response.status === 200) {
        let currentPrice = response.data.market_data.current_price.inr;
        let priceChangePer24h = response.data.market_data.price_change_percentage_24h;
        let coinInfo = "*" + attr + "*:\n\nCurrent Price: " + currentPrice + " INR\n%Change(24h): " + priceChangePer24h;
        sendText(client, message, coinInfo);
      } else {
        console.log(response);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

String.prototype.shuffle = function () {
  var a = this.split(""),
    n = a.length;

  for (var i = n - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a.join("");
};
