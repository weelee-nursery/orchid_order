"use strict";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;
const stripepayment = require("./stripepayment");
const admin = require("./admin");

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()), // creates express http server
  stripe = require("stripe")(process.env.STRIPE_TEST);

let data;
let stage = "Begin-Response";
var doAmend = false;
let amendSection;
let paymentlink;
var orderContent = {};
var flowerDetails;
var orderStalks;


app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.get("/", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  console.log(token);
  console.log(verify_token);
  res.send("complete");
});

// Accepts POST requests at /webhook endpoint
app.post("/webhook", async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;
  if (body.entry[0].changes[0].value.messages) {
    console.log(req.body.entry[0].id);

    // console.log(req.body.entry[0].changes[0]);
    // console.log("has message");
    console.log("running webhook @ Stage " + stage);
    res.status(200).send("EVENT_RECEIVED");
    switch (stage) {
      case "Begin-Response":
        sendIntroMessage(req, res);
        break;
      case "Admin-NewPayment":
        receiveAdminOrderDetails(req, res);
        break;
      case "Initiation":
        receiveIntroMessage(req, res);
        break;
      case "Inform-Contact":
        sendContactToAdmin(req, res);
        break;
      case "SendPictures":
        sendCataloguesBundle(req,res);
        break;
      case "Order-Flowers":
        receiveFlowerDetails(req, res);
        break;
      case "Order-Boxes":
        receiveBoxesDetails(req, res);
        break;
      case "Order-Details":
        receiveOrderDetails(req, res);
        break;
    case "Order-Confirmation":
        receiveOrderConfirmation(req, res);
        break;
    }
  } else {
    // sendOrderCompleted(req,res);
    // console.log("no message");
    res.sendStatus(404);
  }

  // Check the Incoming webhook message
  // console.log(JSON.stringify(req.body, null, 2));
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
  **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

const Send = async function (req, res) {
  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (
    req.body.entry &&
    req.body.entry[0].changes &&
    req.body.entry[0].changes[0] &&
    req.body.entry[0].changes[0].value.messages &&
    req.body.entry[0].changes[0].value.messages[0]
  ) {
    var phone_number_id =
      req.body.entry[0].changes[0].value.metadata.phone_number_id;
    var config = {
      method: "POST",
      url:
        "https://graph.facebook.com/v15.0/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        console.log("work");
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
        console.log(error.config);
      });
  }
};

const WriteData = function (from,message,button){
    data = JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "text",
            text: "Orchid Giftbox Order",
          },
          body: {
            text: message
          },
          footer: {
            text: "Wee Lee Orchid",
          },
          action: {
            buttons: button,
          },
        },
      });
}

//Button Reply Option with "Order", "Contact", and "Catalogue"
function sendIntroMessage(req, res) {
  var initialMsg = req.body.entry[0].changes[0].value.messages[0].text.body;
  if(initialMsg === "admin797977"){
    sendAdminORderDetails(req,res);
  } else {
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var button = [{type: "reply",reply: {id: "order_form",title: "Order"}},
    {type: "reply",reply: {id: "catalogue",title: "Catalogue"}},
    {type: "reply",reply: {id: "contact",title: "Chat with us"}}]
    var message = "Welcome! Wee Lee Orchid provide the best orchid gift box for you to bring back home. " +
    "To order, click on the on Order Button below. To speak to our staff, click on the Contact button below.";
    WriteData(from,message,button);
    stage = "Initiation";
    Send(req, res);
  }
}

function sendAdminORderDetails(req,res){
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var message = "Template" + 
    "\nTotal Stalks:" + 
    "\nTotal Boxes:" + 
    "\nTotal Price: " + 
    "\nName:" + 
    "\nHotel Name:" + 
    "\nHotel Room Number:" + 
    "\nDelivery Date:" + 
    "\nDelivery Time (Time leaving from hotel, as we will ensure order be delivered at least 1hr before):" +
    "\nRemarks (Leave any message for us):";
    var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
    WriteData(from,message,button);
    Send(req, res);
    stage = "Admin-NewPayment";
}

function receiveAdminOrderDetails(req, res) {
  // let result = req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.id;
  if (req.body.entry[0].changes[0].value.messages[0].interactive) {
    //Go back to main
    sendIntroMessage(req,res);
  } else {
    let message = req.body.entry[0].changes[0].value.messages[0].text.body;  
    //Read order detail content
    checkAdminOrderDetails(req,res, message);
  }
}

async function checkAdminOrderDetails(req,res,message){
  //check if any of the order details is empty
  var separateLines = message.split(/\r?\n|\r|\n/g);
  var details = {};
  separateLines.forEach((line,index)=> {
    if(line.includes(":")){
      var title = line.split(":")[0];
      var detail = line.split(":")[1];
      details[title] = detail;
    }
  });
  console.log(details['Total Price'].replace(/ /g,''))
  var priceInt = parseInt(details['Total Price'].replace(/ /g,'') + "00");
  sendCustomOrderPaymentInfo(req,res,priceInt);

}

//Create stripe payment link and send it
async function sendCustomOrderPaymentInfo(req, res, priceInt) {
  console.log('running send payment')
  // configurePricingLinkFromQty(orderContent.quantity);
  stripepayment.createcustom(priceInt, (link)=>{
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id; // extract the phone number from the webhook payload
    data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        preview_url: false,
        body:
          "Use this link to make payment. \n" + link,
      },
    });
    Send(req, res);
    stage = "Order-Payment";
    resolveAfter4Seconds();
    Waitforcustompaymentsuccess(priceInt);
  });

}

var custompaymentsuccess = false;

app.get("/complete-customorder", (req, res) => {
  custompaymentsuccess = true;
  res.send("complete");
});

async function Waitforcustompaymentsuccess(priceInt) {
    if(custompaymentsuccess === false) {
      console.log("waiting send complete");
      setTimeout(function(){Waitforcustompaymentsuccess(priceInt)}, 4000); /* this checks the flag every 100 milliseconds*/
    } else {
      console.log("payment success proceed");
      /* do something*/
      var price = "$" + (priceInt/100);
      admin.receiveCustomOrderDetails(price);
    }
}


async function sendCatalogueImage(req, res, imgurl) {
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "image",
      image: {
        "link": imgurl
      },
    });
    Send(req,res);
  }
  
async function sendCataloguesBundle(req,res){
    stage = "SendPictures";
    sendCatalogueImage(req,res,"https://cdn.glitch.global/526ee81e-0fd4-4fa1-ad84-3b366d38e251/dendrobium_white.jpeg?v=1674258160066");
    await resolveAfter4Seconds();
    sendCatalogueImage(req,res,"https://cdn.glitch.global/526ee81e-0fd4-4fa1-ad84-3b366d38e251/dendrobium_pink.jpeg?v=1674258169035");
    await resolveAfter4Seconds();
    sendCatalogueImage(req,res,"https://cdn.glitch.global/526ee81e-0fd4-4fa1-ad84-3b366d38e251/dendrobium_purple.jpeg?v=1674258191884");
    await resolveAfter4Seconds();
    sendCatalogueImage(req,res,"https://cdn.glitch.global/526ee81e-0fd4-4fa1-ad84-3b366d38e251/dendrobium_green.jpeg?v=1674258209154");
    await resolveAfter4Seconds();
    sendIntroMessage(req,res);
  }
  
async function sendContactToAdmin(req, res) {
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        preview_url: false,
        body: "We will contact you shortly via another whatsapp number. Thank you.",
      },
    });
    Send(req,res);
    stage = "Inform-Contact";
    admin.send("Wee Lee Orchid Order: Speak to https://wa.me/" + from);
    await resolveAfter4Seconds();
    sendIntroMessage(req,res);
  }
  
function resolveAfter4Seconds() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('resolved');
      }, 4000);
    });
  }

//Determine if Intro is replied with "Order", "Contact", or "Catalogue"
function receiveIntroMessage(req, res) {
  let result = req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.id;
  switch (result) {
    case "order_form":
      sendFlowerDetails(req, res);
      break;
    case "contact":
      sendContactToAdmin(req, res);
      break;
    case "catalogue":
      sendCataloguesBundle(req,res);
      break;
  }
}

function sendFlowerDetails(req, res) {
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "What color and quantity would you like to buy? " + 
  "\nThese are the colors available: red, pink, green, yellow, purple, orange, mixed" + 
  "\nThe total minimum stalks is 30. " + 
  "\nPrice is as follow: " + 
  "\nLess than 40 stalks: $1.50 per stalk." +
  "\n40 or more : $1.30 per stalk." +
  "\nPlease reply this message by writing in each new color on a new line." + 
  "\nExample:" + 
  "\n20 red" + 
  "\n10 green" + 
  "\n20 pink";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Flowers";
}

function receiveFlowerDetails(req, res) {
  // let result = req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.id;
  // console.log(result);
  if (req.body.entry[0].changes[0].value.messages[0].interactive) {
    //Go back to main
    sendIntroMessage(req,res);
  } else {
    let message = req.body.entry[0].changes[0].value.messages[0].text.body;
    //Read flower detail content
    ReadFlowerDetails(req,res, message);
  }
}

const ReadFlowerDetails = function (req,res, message) {
  var totalStalks = 0;
  // Split the string on \n or \r characters
  var separateLines = message.split(/\r?\n|\r|\n/g);
  separateLines.forEach((value,key) => {
    var res =  parseInt(value.replace(/\D/g, ""));
    console.log(res);
    totalStalks += res;
  })
  if(totalStalks){
    console.log("recorded total stalks", totalStalks);
    if(totalStalks >= 30){
      flowerDetails = message;
      sendBoxesDetails(req,res);   
      orderStalks = totalStalks;
      
    }else {
      sendFlowerDetailUnderMinimum(req,res);
    }
  } else {
    console.log('total stalks error, message might have a problem');
    sendFlowerDetailError(req,res);
  }
}

function sendFlowerDetailError(req, res) {
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "There is error in your reply. Please type according to this format." + 
  "\nExample:" + 
  "\n20 red" + 
  "\n10 green" + 
  "\n20 pink";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Flowers";
}

function sendFlowerDetailUnderMinimum(req, res) {
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "Your order quantity is too little. Please order a minimum of 30 stalks. Try typing according to this format again:" + 
  "\nExample:" + 
  "\n20 red" + 
  "\n10 green" + 
  "\n20 pink";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Flowers";
}

function sendBoxesDetails(req, res) {
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "Do you require extra boxes for your flowers? Each extra box will be at $2." + 
  "\nEnter the number of extra boxes you need. Enter '0' if no extra is needed.";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Boxes";
}

function receiveBoxesDetails(req, res) {
  // let result = req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.id;
  if (req.body.entry[0].changes[0].value.messages[0].interactive) {
    //Go back to main
    sendIntroMessage(req,res);
  } else {
    let message = req.body.entry[0].changes[0].value.messages[0].text.body;
    checkBoxesDetail(req,res,message);
    
  }
}

var boxOrder = 0;
function checkBoxesDetail(req,res,message){
  if(/^\d+$/.test(message)){
    var boxCount =  parseInt(message.replace(/\D/g, ""));
    boxOrder = boxCount;
    sendOrderDetails(req,res);
  } else {
    sendOrderBoxError(req,res);
    
  }
//   var boxCount =  parseInt(message.replace(/\D/g, ""));
//   console.log(message + " " + boxCount);
//   if(!isNaN(boxCount)){
//     //Read box details
//     boxOrder = boxCount;
//     sendOrderDetails(req,res);
//   }  else {
//     sendOrderBoxError(req,res);
    
//   }

}

function sendOrderBoxError(req,res){
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "Please enter the only numbers on the number of box required.";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Boxes"
}


function sendOrderDetails(req, res) {
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var message = "Please use this template to add your order details," + 
    "\nName:" + 
    "\nHotel Name:" + 
    "\nHotel Room Number:" + 
    "\nDelivery Date:" + 
    "\nDelivery Time (Time leaving from hotel, as we will ensure order be delivered at least 1hr before):" +
    "\nRemarks (Leave any message for us):";
    var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
    WriteData(from,message,button);
    Send(req, res);
    stage = "Order-Details";
  }
  
function receiveOrderDetails(req, res) {
  // let result = req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.id;
  if (req.body.entry[0].changes[0].value.messages[0].interactive) {
    //Go back to main
    sendIntroMessage(req,res);
  } else {
    let message = req.body.entry[0].changes[0].value.messages[0].text.body;  
    //Read order detail content
    checkOrderDetails(req,res, message);
  }
}

function checkOrderDetails(req,res,message){
  //check if any of the order details is empty
  var separateLines = message.split(/\r?\n|\r|\n/g);
  var detailEmpty = false;
  var details = {};
  separateLines.forEach((line,index)=> {
    if(line.includes(":")){
      var title = line.split(":")[0];
      var detail = line.split(":")[1];
      if(!detail && title != "Remarks (Leave any message for us)"){
        detailEmpty = true;
        console.log(title + " is empty");
      }
      details[title] = detail;
    }
  });
  // console.log(details);
  if(detailEmpty){
    sendOrderDetailError(req,res);
  } else {
    orderContent = details;
    sendOrderConfirmationInfo(req,res);
  }
}

function convertOrderContentToInfo(){
  var confirmText ="";
  for (const [key, value] of Object.entries(orderContent)) {
    confirmText += (key + ":" + value + "\n");
  }
  confirmText += "Order:\n" + flowerDetails + "\n";
  confirmText += "Extra Box: " + boxOrder;
  return confirmText;
}

function sendOrderDetailError(req,res){
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = "Please do not leave any detail empty";
  var button = [{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Details";
}
//Send button reply and order content
function sendOrderConfirmationInfo(req, res) {
  //convert order content into string for body
  var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  var message = convertOrderContentToInfo();
  var button = [{type: "reply",reply: {id: "confirm",title: "Confirm"}},{type: "reply",reply: {id: "cancel",title: "Cancel"}}]
  WriteData(from,message,button);
  Send(req, res);
  stage = "Order-Confirmation";
}

//Receive button reply, go to order part eight or part nine
function receiveOrderConfirmation(req, res) {
  let result =
    req.body.entry[0].changes[0].value.messages[0].interactive.button_reply.title;
  switch (result) {
    case "Cancel":
      sendIntroMessage(req, res);
      break;
    case "Confirm":
      sendOrderPaymentInfo(req, res);
      break;
  }
}

//Create stripe payment link and send it
function sendOrderPaymentInfo(req, res) {
  // configurePricingLinkFromQty(orderContent.quantity);
  stripepayment.create(boxOrder, orderStalks, (link)=>{
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id; // extract the phone number from the webhook payload
    data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        preview_url: false,
        body:
          "Please go to this link to payment your payment now. \n" + link,
      },
    });
    Send(req, res);
    stage = "Order-Payment";
    resolveAfter4Seconds();
    Waitforpaymentsuccess(req, res);
  });

}

var paymentsuccess = false;

app.get("/complete", (req, res) => {
  paymentsuccess = true;
  res.send("complete");
});

async function Waitforpaymentsuccess(req,res) {
    var from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    var phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id; // extract the phone number from the webhook payload
    if(paymentsuccess === false) {
      console.log("waiting send complete");
      setTimeout(function(){Waitforpaymentsuccess(req,res)}, 4000); /* this checks the flag every 100 milliseconds*/
    } else {
      console.log(phone_number_id,from);
      console.log("payment success proceed");
      /* do something*/
      admin.receiveOrderDetails(convertOrderContentToInfo());
      SendComplete(phone_number_id,from);
      await resolveAfter4Seconds();
      sendIntroMessage(req, res);
    }
}

const SendComplete = async function (phone_number_id,from) {
  // info on WhatsApp text message payload: https://developers.facebook.com/blog/post/2022/10/31/sending-messages-with-whatsapp-in-your-nodejs-application/
  var data = JSON.stringify({
    messaging_product: "whatsapp",
    preview_url: false,
    recipient_type: "individual",
    to: from,
    type: "text",
    text: {
      body: "We have received your payment. Thank you for your order!",
    },
  });
    var config = {
      method: "POST",
      url:
        "https://graph.facebook.com/v15.0/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: data,
      headers: {
        "Content-Type": "application/json",
      },
    };
  axios(config)
    .then(function (response) {
      console.log("work");
    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      console.log(error.config);
    });
};
