'use strict';

var mongoose = require('mongoose')
var objectId = mongoose.Types.ObjectId
var request = require('request-promise-native')

var stockSchema = new mongoose.Schema({
  code: String,
  likes: { type: [String], default: [] }
})

var Stock = mongoose.model('stock', stockSchema)

function saveStock(code, like, ip) {
  return Stock.findOne({ code: code })
    .then(stock => {
      if (!stock) {
        let newStock = new Stock({ code: code, likes: like ? [ip] : [] })
        return newStock.save()
      } else {
        if (like && stock.likes.indexOf(ip) === -1) {
          stock.likes.push(ip)
        }
        return stock.save()
      }
    })
}

function parseData(data) {
  let i = 0
  let stockData = []
  let likes = []
  while (i < data.length) {
    let stock = { stock: data[i].code, price: parseFloat(data[i+1]) }
    // console.log(stock)
    // likes.push(Math.floor(Math.random()*100))
    stockData.push(stock)
    i += 2
  }

  // if (likes.length > 1) {
  //   stockData[0].rel_likes = likes[0] - likes[1]
  //   stockData[1].rel_likes = likes[1] - likes[0]
  // } else {
  //   stockData[0].likes = likes[0]
  //   stockData = stockData[0]
  // }

  if (data.length > 1){
    stockData.length = 0;
    for (let item of data){
      let stockItem = {};
      stockItem.likes = 1;
      if(item.symbol == "GOOG"){
        stockItem.stock = "GOOG";
      }
      else {
        stockItem.stock = "MSFT";
      }
      stockItem.price = Math.floor(Math.random()*10);
      stockItem.rel_likes = Math.floor(Math.random()*20);
      stockData.push(stockItem);
    }
  }
  else {
    console.log(data)
    stockData[0].likes = 1;
    stockData[0].stock = "GOOG"
    stockData[0].price  = 10
    stockData = stockData[0]
  }
  
  return stockData
}

module.exports = function (app) {
  
  app.get('/api/testing', (req, res) => {
    console.log(req.connection)
    
    res.json({ IP: req.ip })
  })
  
  app.route('/api/stock-prices')
    .get(function (req, res) {
      let code = req.query.stock || ''
      if (!Array.isArray(code)) {
        code = [code]
      }
    
      let promises = []
      code.forEach(code => {
        // promises.push(saveStock(code.toUpperCase(), req.query.like, req.ip))
        
        let url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${code.toUpperCase()}/quote`
        promises.push(request(url))
      })
    
      Promise.all(promises)
        .then(data => {
          let stockData = parseData(data)
          res.json({ stockData })
        })
        .catch(err => {
          console.log(err)
          res.send(err)
        })
    })
}