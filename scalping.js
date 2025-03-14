// scalping.js - Грамотный ТА для ПД (Pussy Destroyer)

// === Подключение Binance API ===
const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";

// === Настройки таймфреймов ===
const timeframes = ["30m", "1h", "4h", "1d"];

// === Функция для получения данных по свечам ===
async function fetchMarketData(symbol, interval) {
    const url = `${BINANCE_API_URL}?symbol=${symbol}&interval=${interval}&limit=100`;
    const response = await fetch(url);
    const data = await response.json();
    return data.map(candle => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

// === Функции для расчета индикаторов ===
function calculateRSI(data, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
        let diff = data[i].close - data[i - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    function calculateEMA(data, period) {
        const multiplier = 2 / (period + 1);
        let ema = [];
        ema[0] = data[0].close;
        for (let i = 1; i < data.length; i++) {
            ema[i] = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
        }
        return ema;
    }
    let shortEMA = calculateEMA(data, shortPeriod);
    let longEMA = calculateEMA(data, longPeriod);
    let macdLine = shortEMA.map((val, i) => val - longEMA[i]);
    let signalLine = calculateEMA(macdLine.slice(longPeriod), signalPeriod);
    let histogram = macdLine.slice(longPeriod).map((val, i) => val - signalLine[i]);
    return { macdLine, signalLine, histogram };
}

function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    let upperBand = [], lowerBand = [], sma = [], stdDev = [];
    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let mean = slice.reduce((acc, val) => acc + val.close, 0) / period;
        let variance = slice.reduce((acc, val) => acc + Math.pow(val.close - mean, 2), 0) / period;
        let std = Math.sqrt(variance);
        sma.push(mean);
        stdDev.push(std);
        upperBand.push(mean + stdDevMultiplier * std);
        lowerBand.push(mean - stdDevMultiplier * std);
    }
    return { middle: sma, upper: upperBand, lower: lowerBand };
}

function calculateOBV(data) {
    let obv = [0];
    for (let i = 1; i < data.length; i++) {
        let direction = data[i].close > data[i - 1].close ? 1 : -1;
        obv.push(obv[i - 1] + direction * data[i].volume);
    }
    return obv;
}

function calculateStochastic(data, period = 14, smoothK = 3, smoothD = 3) {
    let kValues = [];
    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let high = Math.max(...slice.map(d => d.high));
        let low = Math.min(...slice.map(d => d.low));
        let k = ((data[i].close - low) / (high - low)) * 100;
        kValues.push(k);
    }
    let dValues = kValues.map((val, i, arr) =>
        arr.slice(Math.max(0, i - smoothD + 1), i + 1).reduce((a, b) => a + b, 0) / smoothD
    );
    return { k: kValues, d: dValues };
}

// === Анализ рынка ===
async function analyzeMarket(symbol) {
    console.log("🔥 Начинаем анализ рынка для", symbol);
    let data = await fetchMarketData(symbol, "30m");
    let indicators = {
        rsi: calculateRSI(data, 14),
        macd: calculateMACD(data, 12, 26, 9),
        bollinger: calculateBollingerBands(data, 20, 2),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data, 14, 3, 3),
    };
    generateSignal(symbol, indicators);
}

// === Генерация торгового сигнала ===
function generateSignal(symbol, indicators) {
    let signal = "Ожидаем нормальный сетап.";
    let argumentsList = [];
    let entry, stopLoss, takeProfit;

    if (indicators.rsi < 30) {
        signal = "Лонг";
        entry = indicators.bollinger.lower[indicators.bollinger.lower.length - 1];
        stopLoss = entry * 0.98;
        takeProfit = entry * 1.05;
        argumentsList.push("RSI перепродан. Скорее всего, отскок вверх.");
    }
    if (indicators.rsi > 70) {
        signal = "Шорт";
        entry = indicators.bollinger.upper[indicators.bollinger.upper.length - 1];
        stopLoss = entry * 1.02;
        takeProfit = entry * 0.95;
        argumentsList.push("RSI перекуплен. Возможен разворот вниз.");
    }

    console.log(`🔥 [${symbol}] Сигнал: ${signal}`);
    console.log("📌 Точка входа:", entry);
    console.log("🛑 Стоп-лосс:", stopLoss);
    console.log("🎯 Тейк-профит:", takeProfit);
    console.log("📝 Аргументы:", argumentsList.join(", "));

    // Отобразить сигнал на странице
    displaySignal(symbol, signal, entry, stopLoss, takeProfit, argumentsList);
}

// === Вывод сигнала в UI ===
function displaySignal(symbol, signal, entry, stopLoss, takeProfit, argumentsList) {
    document.querySelector("#signal-box").innerHTML = `
        <h3>🔥 Pump & Dump Club</h3>
        <p><strong>Сигнал:</strong> ${signal}</p>
        <p><strong>Точка входа:</strong> $${entry.toFixed(2)}</p>
        <p><strong>Стоп-лосс:</strong> $${stopLoss.toFixed(2)}</p>
        <p><strong>Тейк-профит:</strong> $${takeProfit.toFixed(2)}</p>
        <p><strong>Аргументы:</strong> ${argumentsList.join(", ")}</p>
    `;
}

console.log("🔥 Scalping.js загружен!");
