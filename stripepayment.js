const stripe = require('stripe')('sk_test_51M171aCHe1dtBxDA8Bc08HabJLec8oVW4s5SZTnbUP2CouafI5dLyDL53sZ1mrnLnc3YR3zHvANbeJ8E1WKv5fln00elR4vC4P');

const create = async function(extraBox, stalks, callback) {
  var amount = getPaymentAmt(extraBox,stalks);
  const product = await stripe.products.create({
    name: 'Custom Orchid Gift Box',
  });
  
  const price = await stripe.prices.create({
    unit_amount: amount,
    currency: 'sgd',
    product: product.id,
  });

  console.log(price);

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{
      price: price.id,
      quantity: 1
    }],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: 'https://protective-typhoon-smell.glitch.me/complete'
      }
    },
  });
  callback(paymentLink.url);
  // console.log(paymentLink);
}
module.exports.create = create;

const createcustom = async function(amount, callback) {
  const product = await stripe.products.create({
    name: 'Custom Orchid Gift Box',
  });
  
  const price = await stripe.prices.create({
    unit_amount: amount,
    currency: 'sgd',
    product: product.id,
  });
  
  console.log('created price');

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{
      price: price.id,
      quantity: 1
    }],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: 'https://protective-typhoon-smell.glitch.me/complete-customorder'
      }
    },
  });
  
  console.log('created paymentlink');
  
  callback(paymentLink.url);
  // console.log(paymentLink);
}
module.exports.createcustom = createcustom;


const paymentlinkforthirtystalks = async function() {
  await stripe.paymentLinks.update(
    'plink_1MC1IPCHe1dtBxDAgwLqiJZb', {
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'http://localhost:3000/complete'
        }
      },
    }
  );
  const paymentLink = await stripe.paymentLinks.retrieve(
    'plink_1MC1IPCHe1dtBxDAgwLqiJZb'
  );
  console.log(paymentLink.after_completion);

  return paymentLink.url;
}
module.exports.paymentlinkforthirtystalks = paymentlinkforthirtystalks;

function getPaymentAmt (extraBox, stalks){
  var boxPrice = parseInt(extraBox) * 2;
  var stalkInt = parseInt(stalks);
  var flowerPrice = (stalkInt - 30) + 45;
  console.log(flowerPrice + " : flower price |" + boxPrice + " : box price");
  var amount = (flowerPrice + boxPrice) * 100;
  return amount;
}


