var axios = require('axios');
const token = process.env.WHATSAPP_TOKEN;

const send = function(content){
  var data = JSON.stringify({
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "6580586598",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": content
  }
});

    var config = {
      method: "POST",
      url:
        "https://graph.facebook.com/v15.0/107373215524926/messages?access_token=" +
        token,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    };

axios(config)
.then(function (response) {
  // console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  // console.log(error);
});

  console.log('sending to admin');
}

module.exports.send = send;

const receiveOrderDetails = function(info){
  var data = JSON.stringify({
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "6580586598",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "New Customer Order: \n" + info
  }
});

    var config = {
      method: "POST",
      url:
        "https://graph.facebook.com/v15.0/107373215524926/messages?access_token=" +
        token,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    };

axios(config)
.then(function (response) {
  // console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  // console.log(error);
});

  console.log('sending to admin');
}

module.exports.receiveOrderDetails = receiveOrderDetails;


const receiveCustomOrderDetails = function(info){
  var data = JSON.stringify({
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "6580586598",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "A customer has made a custom payment of " + info
  }
});

    var config = {
      method: "POST",
      url:
        "https://graph.facebook.com/v15.0/107373215524926/messages?access_token=" +
        token,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    };

axios(config)
.then(function (response) {
  // console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  // console.log(error);
});

  console.log('sending to admin');
}

module.exports.receiveCustomOrderDetails = receiveCustomOrderDetails;