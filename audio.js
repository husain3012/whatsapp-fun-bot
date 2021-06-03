const googleTTS = require("google-tts-api");
const venom = require("venom-bot");
const _ = require("lodash");
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require("axios");
googleTTS
  .getAudioBase64("Hello World", {
    lang: "en",
    slow: false,
    host: "https://translate.google.com",
    timeout: 10000,
  })
  .then(data=>{
      console.log(data)
  }) // base64 text
 
