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
    return data.map((candle) => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

// === Функции для расчета индикаторов ===
function calculateRSI(data, period) {
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

function calculateMACD(data, shortPeriod, longPeriod, signalPeriod) {
    let shortEMA = calculateEMA(data, shortPeriod);
    let longEMA = calculateEMA(data, longPeriod);
    let macdLine = shortEMA.map((val, i) => val - longEMA[i]);
    let signalLine = calculateEMA(macdLine.slice(longPeriod), signalPeriod);
    let histogram = macdLine.slice(longPeriod).map((val, i) => val - signalLine[i]);
    return { macdLine: macdLine.slice(longPeriod), signalLine, histogram };
}

function calculateBollingerBands(data, period, stdDevMultiplier) {
    let upperBand = [], lowerBand = [], sma = [];
    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let mean = slice.reduce((acc, val) => acc + val.close, 0) / period;
        sma.push(mean);
        let variance = slice.reduce((acc, val) => acc + Math.pow(val.close - mean, 2), 0) / period;
        let std = Math.sqrt(variance);
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

function calculateStochastic(data, period, k) {
    let stochastic = [];
    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let high = Math.max(...slice.map(c => c.high));
        let low = Math.min(...slice.map(c => c.low));
        let kValue = ((data[i].close - low) / (high - low)) * 100;
        stochastic.push(kValue);
    }
    return stochastic;
}

// === Определение зон поддержки/сопротивления ===
function detectSupportResistance(data) {
    return detectPOC(data).concat(detectLiquidityClusters(data));
}

// === Поиск паттернов ===
function detectPatterns(data) {
    return ["Голова и плечи", "Клин", "Флаг", "Треугольник"].filter(pattern => detectPattern(data, pattern));
}

// === Генерация торгового сигнала ===
function generateSignal(data, indicators, supportResistance, patterns) {
    let signal = "Ожидаем нормальный сетап.";
    let arguments = [];
    
    let entry, stoploss, takeProfit;
    if (patterns.includes("Голова и плечи")) {
        signal = "Шорт";
        entry = data[data.length - 1].close;
        stoploss = entry * 1.02;
        takeProfit = entry * 0.98;
    }
    return { signal, entry, stoploss, takeProfit, arguments };
}

// === Анализ рынка ===
async function analyzeMarket(symbol) {
    console.log("🔥 Начинаем анализ рынка для", symbol);
    let data = await fetchMarketData(symbol, "1h");
    let indicators = {
        rsi: calculateRSI(data, 14),
        macd: calculateMACD(data, 12, 26, 9),
        bollinger: calculateBollingerBands(data, 20, 2),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data, 14, 3)
    };
    let supportResistance = detectSupportResistance(data);
    let patterns = detectPatterns(data);
    let signal = generateSignal(data, indicators, supportResistance, patterns);
    console.log("📊 Итоговый сигнал: ", signal);
    return signal;
}

console.log("🔥 scalping.js загружен!");
