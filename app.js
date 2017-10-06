const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const request = require('request');
const API_TOKEN = "39e70b551e0140d5bd9debf1b022e2b0";
const aiApp    = require('apiai')(API_TOKEN);
const VALID_TOKEN   = "ACVBnm";
const SERVER_URL    = "https://c43f8216.ngrok.io";
const ACCESS_TOKEN  = "EAAFoboTScRwBAN2EhAIpUTV87DJG9nov1bkxj37SSmG7LR9sdsIW1ulSR4pOXkJUxU7GEuItuq9Ixqzhyj37EFXBhymXH7DdjiyYQugivZC2LV3V6y7X5jwXZBa2MvEQCY1mTvICoZBddj21UK1klWHwPjCYVgkPTRkRIUHEZAwcgPq1ZAI4h"; 
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
})

/* Hello Data */
app.get('/', (req, res) => {
    console.log('Server Ok!');
    res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === VALID_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

/* Handling Pesan */
app.post('/webhook', (req, res) => {
    //console.log(req.body);
    if (req.body.object === 'page') {
      req.body.entry.forEach((entry) => {
        entry.messaging.forEach((event) => {
          if (event.message && event.message.text) {
            sendMessage(event);
            console.log(event);
          }
        });
      });
      res.status(200).end();
    }
  });

/*function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    
    console.log("Dikirim ke %s ", sender);

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: text}
      }
    }, function (error, response) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  }*/

  function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    let apiai = aiApp.textRequest(text, {
      sessionId: 'anakjalananbro'
    });

    apiai.on('response', (response) => {
      // Response ke Facebook messenger
      	let aiText = response.result.fulfillment.speech;
		console.log("response ai %s ", aiText);
		request({
		    url: 'https://graph.facebook.com/v2.6/me/messages',
		    qs: {access_token: ACCESS_TOKEN},
		    method: 'POST',
		    json: {
		        recipient: {id: sender},
		        message: {text: aiText}
		    }
		}, (error, response) => {
		    if (error) {
		        console.log('Error sending message: ', error);
		    } else if (response.body.error) {
		        console.log('Error: ', response.body.error);
		    }
		});
    });

    apiai.on('error', (error) => {
      console.log(error);
    });

    apiai.end();
  }

  const WEATHER_API_KEY   = "7f060ac1edaaa0052b8eae2992eff568";
	app.post('/ai', (req, res) => {
    if (req.body.result.action === 'weather') {
        let city = req.body.result.parameters['geo-city'];
        console.log(city);
        let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+WEATHER_API_KEY+'&q='+city;
        request.get(restUrl, (err, response, body) => {
            if (!err && response.statusCode == 200) {
                let json = JSON.parse(body);
                let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' ℉';
                return res.json({
                  speech: msg,
                  displayText: msg,
                  source: 'weather'});
              } else {
                return res.status(400).json({
                  status: {
                    code: 400,
                    errorType: 'I failed to look up the city name.'}});
              }
        });
    }
  });