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
});
const User = mongoose.model("user", userSchema);

// Variables:
let preprocessor = ".";
let autoResponseEnabled = true;

venom
  .create()
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    createOrFindUser(message);
    message.body = _.toLower(message.body);
    if (autoResponseEnabled) {
      autoResponse(client, message);
    }

    if (message.body.slice(0, 1) === preprocessor) {
      let commands = message.body.slice(1).split(" ");

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
        case "scramble":
          // scrambleGame(client, message, false);
          break;
        case "test":
          sendGiphy(client, message, query);
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
  if(caption===undefined){
    caption=""
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

function sendGifAsSticker(client, recvMsg, attr) {
  if (attr.length < 1) {
    attr = "What you want";
  }
  console.log(attr);
  axios
    .get("https://api.gfycat.com/v1/stickers/search", { params: { search_text: attr } })
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      } else {
        console.log(response.status);
        return false;
      }
    })
    .then((results) => {
      if (results) {
        let rand = Math.floor(Math.random() * results.gfycats.length);
        let gif = results.gfycats[rand].gif100px;
        client
          .sendImageAsStickerGif(recvMsg.from, gif)
          .then((result) => {
            console.log("Result: ", result); //return object success
          })
          .catch((erro) => {
            console.error(", Trying again, Error when sending: ", erro); //return object error
            sendGifAsSticker(client, recvMsg, attr);
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

function imgurSearch(client, recvMsg, query) {
  console.log("Fetching from imgur");
  const config = {
    method: "get",
    url: "https://api.imgur.com/3/gallery/search/{{sort:top}}/{{window}}/{{page}}?q_type=jpg&q=" + query,
    headers: {
      Authorization: process.env.IMGRTOKEN,
    },
  };

  axios(config).then(function (response) {
    let rand = Math.floor((Math.random() * response.data.data.length) / 3);
    let img = response.data.data[rand].images[0].link;
    console.log(img);
    if (img.slice(-3) === "mp4") {
      imgurSearch(client, recvMsg, query);
    } else {
      sendImage(client, recvMsg, img);
    }
  });
}

function sendRedditMeme(client, recvMsg, attr) {
  if (attr === "r") {
    sendHorny(client, recvMsg, "NSFWFunny");
  } else {
    console.log("Searching for meme");
    axios.get("https://meme-api.herokuapp.com/gimme/memes").then((response) => {
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
  if (attr === "69forlife") {
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
  nsfwSubreddits=["gooned","gonewild","boobs","cumsluts", "blowjob", "nsfwhardcore"]
  if(attr===undefined){
    attr = nsfwSubreddits[Math.floor(Math.random()*nsfwSubreddits.length)]
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
            console.log("redirecting to giphy")
            sendGiphy(client, recvMsg, query);
          }
        }
      } else {
        console.log(response.status);
      }
    })
    .catch((e) => {
      console.log(e);
      console.log("redirecting to giphy")
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

function sendHelp(client, user) {
  let help = `*${preprocessor}help*: Sends this message.\n\n*${preprocessor}truth*: Sends a truth question.\n\n*${preprocessor}dare*: Sends a dare.\n\n*${preprocessor}nhie*: Sends a Never have i ever questoin.\n\n*${preprocessor}roast <name>*: Roasts entered user.\n\n*${preprocessor}meme*: Sends a fresh meme from r/memes.\n\n*${preprocessor}gimme <search>*: Sends a relatable image from a matching subreddit. Example: ${preprocessor}gimme PuppySmiles\n\n*${preprocessor}sticker <search>*: Sends a relatble sticker. Example: ${preprocessor}sticker Thank You`;
  let helpAdult = `*${preprocessor}help*: Sends this message.\n\n*${preprocessor}truth*: Sends a truth question. Use _${preprocessor}truth r_ for adult questions.\n\n*${preprocessor}dare*: Sends a dare. Use _${preprocessor}dare r_ for adult dares.\n\n*${preprocessor}nhie*: Sends a Never have i ever questoin. Use _${preprocessor}nhie r_ for adult questions.\n\n*${preprocessor}roast <name>*: Roasts entered user.\n\n*${preprocessor}meme*: Sends a fresh meme from r/memes. Use _${preprocessor}meme r_ for adult memes.\n\n*${preprocessor}gimme <search>*: Sends a relatable image from a matching subreddit. Example: ${preprocessor}gimme PuppySmiles\n\n*${preprocessor}sticker <search>*: Sends a relatble sticker. Example: ${preprocessor}sticker Thank You\n\n*${preprocessor}horny <search>*: Supports NSFW images. Example: _${preprocessor}horny butt_`;
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
