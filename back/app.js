"use strict";

const express = require('express');
const app = express();
const record = require('node-record-lpcm16')
const snowboy = require('snowboy');
const Models = snowboy.Models;
const Detector = snowboy.Detector;
const http = require('http').Server(app);
const ApiAi = require('apiai-promise')
const config = require('./config.js');
const apiai = ApiAi(config.apiaitoken);
const sessionId = 'marcel';
const models = new Models();

models.add({
  file: 'resources/marcel.pmdl',
  sensitivity: '0.4',
  hotwords: 'marcel'
})

const detector = new Detector({
  resource: 'resources/common.res',
  audioGain: 2.0,
  models
})

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  next()
})

app.get('/', (req, res) => {
  res.sendfile("public/index.html");
});

/**
 * WebSocket
 */
const expressWs = require('express-ws')(app);

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    const request = JSON.parse(msg);
    switch (request.type) {
      case 'speech':
        apiai.textRequest(request.message, { sessionId })
          .then(response => {
            console.log("Intent " + response.result.metadata.intentName)
            expressWs.getWss().clients.forEach(client => {
              client.send(JSON.stringify(
                {
                  intentName: response.result.metadata.intentName,
                  content: response.result.parameters,
                  fulfillment: response.result.fulfillment
                }
              ));
            })
          })
          .catch(err => console.log("error : " + err))
        break;
    }
  })
})

/**
 * Server itself
 * @type {http.Server}
 */
const server = app.listen(8080, () => {
  //print few information about the server
  const host = server.address().address;
  const port = server.address().port;
  console.log("Server running and listening @ " + host + ":" + port);
});

detector.on('hotword', (index, hotword) => {
  expressWs.getWss().clients.forEach(client => client.send({ type: 'hotword' }))
})

const mic = record.start(config.microphone);
mic.pipe(detector);
