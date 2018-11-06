const API_PATH = 'https://api.exmo.com/v1/';

function MACD(rates, fast_ma, slow_ma, signal) {
  if (fast_ma === void 0) {
    fast_ma = 12;
  }
  if (slow_ma === void 0) {
    slow_ma = 26;
  }
  if (signal === void 0) {
    signal = 9;
  }
  let ema_fast = rates[0];
  let ema_slow = rates[0];
  let sig = ema_slow - ema_fast;
  const ew_fast = 2 / (fast_ma + 1);
  const ew_slow = 2 / (slow_ma + 1);
  const ew_signal = 2 / (signal + 1);
  const macd = [];
  for (let _i = 0, rates_1 = rates; _i < rates_1.length; _i++) {
    const p = rates_1[_i];
    ema_fast = (p - ema_fast) * ew_fast + ema_fast;
    ema_slow = (p - ema_slow) * ew_slow + ema_slow;
    const macd_ = ema_fast - ema_slow;
    sig = (macd_ - sig) * ew_signal + sig;
    macd.push([macd_, sig]);
  }
  return macd;
}

function makeChart(pair, limit, period) {
  // limit устанавливает количество возвращаемых сделок от 1 то 10000, period - период закрытия свечей в минутах

  return fetch(`${API_PATH}trades/?pair=${pair}&limit=${limit}`)
    .then(res => res.json())
    .then(data => data[pair])
    .then((deals) => {
      deals.reverse(); // Сделки приходят отсортированные по времени в порядке убывания. Инвертируем порядок

      let tick = [];
      const ticks = [];
      const candles = [];
      const closeDates = [];
      const closePrices = [];

      let tickDivider = deals[0].date + period * 60; // Время самой ранней сделки + период (в секундах)

      for (const deal of deals) {
        if (deal.date < tickDivider) {
          // Если сделка в пределах периода, записываем ее в тик
          tick.push(deal);
        } else {
          // Если нет - период кончился, формируем свечу

          const candle = {};
          const tickPrices = tick.map(deal => deal.price);
          const candlePrices = [
            parseFloat(tick[0].price),
            Math.max(...tickPrices),
            Math.min(...tickPrices),
            parseFloat(tick[tick.length - 1].price),
          ];

          candle.x = tick[tick.length - 1].date * 1000;
          candle.y = [...candlePrices];
          candles.push(candle);

          closePrices.push(parseFloat(tick[tick.length - 1].price)); // Запоминаем цену закрытия
          tickDivider += period * 60; // Продливаем период
          tick = [deal]; // Запоминаем первую сделку нового периода и едем дальше
        }
      }

      const macdData = MACD(closePrices);
      const _macd = [];
      const _signal = [];

      candles.map((candle, index) => {
        _macd.push({ x: candle.x, y: macdData[index][0] });
        _signal.push({ x: candle.x, y: macdData[index][1] });
      });

      const data = {
        candles,
        signal: _signal,
        macd: _macd,
      };

      return data; // Свечи и индикаторы готовы
    })
    .catch((err) => {
      console.log(err);
    });
}

function toggleDataSeries(e) {
  if (typeof e.dataSeries.visible === 'undefined' || e.dataSeries.visible) {
    e.dataSeries.visible = false;
  } else {
    e.dataSeries.visible = true;
  }
  e.chart.render();
}

// Test

makeChart('BTC_USD', 10000, 5)
  .then((data) => {
    const chart = new CanvasJS.Chart('chartContainer', {
      animationEnabled: true,
      theme: 'dark2', // "light1", "light2", "dark1", "dark2"
      exportEnabled: false,
      title: {
        text: 'Test candlestick chart for EXMO',
      },
      subtitles: [
        {
          text: 'pair: BTC_USD, tick: 5 min',
        },
      ],
      axisX: {
        interval: 30,
        intervalType: 'minute',
        valueFormatString: 'HH:mm',
        tickLength: 15,
        gridDashType: 'dot',
        gridThickness: 1,
        crosshair: {
          enabled: true,
          snapToDataPoint: true,
        },
        // interlacedColor: "#EEE"
      },
      axisY: {
        includeZero: false,
        prefix: '$',
      },
      axisY2: {
        title: 'MACD & SIGNAL',
        tickLength: 15,
      },
      toolTip: {
        shared: true,
      },
      legend: {
        reversed: true,
        cursor: 'pointer',
        itemclick: toggleDataSeries,
      },
      data: [
        {
          type: 'candlestick',
          showInLegend: true,
          name: 'Stock Price',
          yValueFormatString: '$#,##0.0000',
          xValueFormatString: 'DDD HH:mm',
          xValueType: 'dateTime',
          dataPoints: data.candles,
        },
        {
          type: 'spline',
          showInLegend: true,
          name: 'MACD',
          axisYType: 'secondary',
          markerType: 'none',
          interlacedColor: '#EEE',
          yValueFormatString: '0.0000',
          xValueFormatString: 'MMMM',
          dataPoints: data.macd,
        },
        {
          type: 'spline',
          showInLegend: true,
          name: 'signal',
          axisYType: 'secondary',
          markerType: 'none',
          yValueFormatString: '0.0000',
          xValueFormatString: 'MMMM',
          dataPoints: data.signal,
        },
      ],
    });
    chart.render();
  })
  .catch((err) => {
    console.log(err);
  });
