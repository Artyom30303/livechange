// 🔥 Pussy Destroyer 2.0 - Новый, полностью рабочий scalping.js

const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";
const timeframes = ["30m", "1h", "4h", "1d"];

async function fetchMarketData(symbol, interval) {
    const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;
    const response = await fetch(url);
    const data = await response.json();

    return data.map(candle => ({
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

// 🔥 Грамотный расчет RSI
function calculateRSI(data, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        let diff = data[i].close - data[i - 1].close;
        gains += diff > 0 ? diff : 0;
        losses += diff < 0 ? -diff : 0;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    if(avgLoss === 0) return 100;

    let rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// 🔥 EMA calculation
function calculateEMA(data, period) {
    let ema = [];
    const k = 2 / (period + 1);
    ema[0] = data[0].close;

    for (let i = 1; i < data.length; i++) {
        ema[i] = data[i].close * k + ema[i - 1] * (1 - k);
    }

    return ema;
}

// 🔥 Грамотный расчет MACD
function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    let shortEMA = calculateEMA(data, shortPeriod);
    let longEMA = calculateEMA(data, longPeriod);

    let macdLine = shortEMA.map((val, i) => val - longEMA[i]).slice(longPeriod);

    if (macdLine.length < signalPeriod) return {macdLine: [], signalLine: [], histogram: []};

    let signalLine = calculateEMA(macdLine.map(val => ({close: val})), signalPeriod);
    let histogram = macdLine.map((val, i) => val - signalLine[i]);

    return { macdLine, signalLine, histogram };
}

// 🔥 Грамотный расчет Bollinger Bands
function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    if(data.length < period) return;

    let sma = data.slice(-period).reduce((acc, val) => acc + val.close, 0) / period;
    let variance = data.slice(-period).reduce((acc, val) => acc + Math.pow(val.close - sma, 2), 0) / period;
    let stdDev = Math.sqrt(variance);

    return {
        middle: sma,
        upper: sma + stdDevMultiplier * stdDev,
        lower: sma - stdDevMultiplier * stdDev
    };
}

// 🔥 Грамотный расчет OBV
function calculateOBV(data) {
    let obv = [0];
    for (let i = 1; i < data.length; i++) {
        if (data[i].close > data[i - 1].close) obv.push(obv[i - 1] + data[i].volume);
        else if (data[i].close < data[i - 1].close) obv.push(obv[i - 1] - data[i].volume);
        else obv.push(obv[i - 1]);
    }
    return obv;
}

// 🔥 Грамотный расчет Stochastic
function calculateStochastic(data, period = 14) {
    if(data.length < period) return;
    let slice = data.slice(-period);
    let high = Math.max(...slice.map(c => c.high));
    let low = Math.min(...slice.map(c => c.low));
    let range = high - low || 1;
    let k = ((data[data.length-1].close - low) / range) * 100;
    return k;
}

// 🔥 Основная функция анализа
async function analyzeMarket(symbol) {
    const data = await fetchMarketData(symbol, "30m");

    const indicators = {
        rsi: calculateRSI(data),
        macd: calculateMACD(data),
        bollinger: calculateBollingerBands(data),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data)
    };

    const lastPrice = data[data.length - 1].close;

    let signal = indicators.rsi < 30 && indicators.stochastic < 20 ? "Лонг 📈" :
                 indicators.rsi > 70 && indicators.stochastic > 80 ? "Шорт 📉" : "Ожидаем 🔸";

    let entry = lastPrice;
    let stopLoss = signal === "Лонг 📈" ? indicators.bollinger.lower : indicators.bollinger.upper;
    let takeProfit = signal === "Лонг 📈" ? indicators.bollinger.upper : indicators.bollinger.lower;

    return { signal, entry, stopLoss, takeProfit, indicators };
}

// 🔥 Запуск анализа рынка
analyzeMarket("BTCUSDT").then(result => {
    console.log("📌 Результат анализа рынка: ", result);
});
