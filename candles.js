const API_PATH = 'https://api.exmo.com/v1/';

function makeCandles(pair, limit, period) { // limit устанавливает количество возвращаемых сделок от 1 то 10000, period - период закрытия свечей в минутах

 return fetch(`${API_PATH}trades/?pair=${pair}&limit=${limit}`)
   .then((res) => {
     return res.json();
   })
     .then((data) => {
       return data[pair];
     })  
       .then(deals => { 

         deals.reverse(); // Сделки приходят отсортированные по времени в порядке убывания. Инвертируем порядок
   
         let tick = []; 
         let ticks = []; 
         let candles = [];
         let tickDivider = deals[0].date + period*60; // Время самой ранней сделки + период (в секундах)

           for (let deal of deals) { 
             if (deal.date < tickDivider) { // Если сделка в пределах периода, записываем ее в тик
               tick.push(deal.price);
             } else { // Если нет - период кончился, формируем свечу
                 let candle = {};
                 candle.open = tick[0]; 
                 candle.close = tick[tick.length - 1];
                 candle.high = Math.max (...tick);
                 candle.low = Math.min (...tick);
                 candles.push(candle);

                 tickDivider = tickDivider + period*60; // Продливаем период
                 tick = [deal.price]; // Запоминаем первую сделку нового периода и едем дальше    
             }
           }

          return (candles); // Свечи готовы
        })   
         .catch((err) => {
           console.log(err);
          });       
};

// Test

let candles = makeCandles('BTC_USD', 1000, 5);
candles
  .then(data => {
    // Some actions with data. Build chart
    console.log(data);
  })
   .catch((err) => {
     console.log(err);
   }); 
