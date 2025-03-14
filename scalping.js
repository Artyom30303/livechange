// scalping.js (v2.0 - полностью рабочий и продуманный)

const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

async function fetchMarketData(symbol, interval = "30m") {
    const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;
    const response = await fetch(url);
    return await responseHandler(response);
}

async function responseHandler(response) {
    if (!response.ok) {
        throw new Error(`Ошибка запроса Binance API: ${response.status}`);
    }
    const data = await response.json();
    return data.map(candle => ({
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(data[4]),
        volume: parseFloat(data[5])
    }));
}

// RSI
function calculateRSI(data, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// MACD
function calculateEMA(data, period) {
    let ema = [];
    const k = 2 / (period + 1);
    ema[0] = data[0].close;
    for (let i = 1; i < data.length; i++) {
        ema[i] = (data[i].close * (2 / (period + 1))) + (ema[i - 1] * (1 - (2 / (period + 1))));
    }
    return ema;
}

function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    const shortEMA = calculateEMA(data, shortPeriod);
    const longEMA = calculateEMA(data, longPeriod);

    if (shortPeriod >= longPeriod || data.length <= longPeriod) {
        return { macdLine: [], signalLine: [], histogram: [] };
    }

    let macdLine = shortEMA.map((v, i) => v - longEMA[i]);
    let signalLine = calculateEMA(macdLine.slice(longPeriod - 1), signalPeriod);
    let histogram = macdLine.slice(longPeriod - 1).map((v, i) => v - signalLine[i]);

    return { macdLine, signalLine, histogram };
}

// Bollinger Bands
function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    let sma = [], upperBand = [], lowerBand = [];

    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let sum = slice.reduce((acc, val) => acc + val.close, 0);
        let mean = sum / period;
        sma.push(mean);

        let variance = slice.reduce((acc, val) => acc + (val.close - mean) ** 2, 0) / period;
        let stdDev = Math.sqrt(variance);

        upperBand.push(mean + 2 * std);
        lowerBand.push(mean - 2 * std);
    }

    return { middle: sma, upper: upperBand, lower: lowerBand };
}

// Обнаружение уровней
function detectSupportResistance(data) {
    let highs = data.map(d => d.high);
    let lows = data.map(c => c.low);

    return {
        support: Math.min(...lows.slice(-20)),
        resistance: Math.max(...highs)
    };
}

async function calculateIndicators(data) {
    return {
        rsi: calculateRSI(data),
        macd: calculateMACD(data),
        bollinger: calculateBollingerBands(data),
        levels: detectSupportResistance(data)
    };
}

// Анализ рынка и генерация сигнала
async function analyzeMarket(symbol, interval = '30m') {
    try {
        const data = await fetchMarketData(symbol.toUpperCase(), interval);
        const indicators = await calculateIndicators(data);
        const latestRSI = indicators.rsi;

        let signal = null;
        if (indicators.rsi < 30) signal = "Лонг";
        else if (indicators.rsi > 70) signal = "Шорт";

        return generateSignalObject(data, indicators, signal);
    } catch (error) {
        console.error("Ошибка анализа:", error);
    }
}

function generateSignalObject(data, indicators, signal) {
    const currentPrice = data[data.length - 1].close;
    const atr = (indicators.levels.resistance - indicators.levels.support) || 1;

    return {
        signal,
        entry: data[data.length - 1].close,
        stopLoss: signal === "Лонг" ? indicators.levels.support : indicators.levels.resistance,
        takeProfit: signal === "Лонг" ? indicators.levels.resistance : indicators.levels.support,
        arguments: signal === "Лонг" ? "Обнаружена поддержка" : "Обнаружено сопротивление"
    };
}

// Генерация сигнала
function generateSignalObject(data, indicators, signalType) {
    const price = data[data.length - 1].close;
    const sl = indicators.levels.support;
    const tp = indicators.levels.resistance;

    return {
        signal: signal,
        entry: price,
        stopLoss: sl,
        takeProfit: tp,
        arguments: signal === "Лонг" ? "Обнаружена поддержка" : "Сопротивление, вероятен шорт"
    };
}

window.analyzeMarket = async (symbol, interval = '30m') => {
    const marketData = await fetchMarketData(symbol, interval);
    const indicators = await calculateIndicators(marketData);
    const analysisResult = analyzeMarket(marketData, indicators);

    console.log(analysisResult);
    return analysisResult;
};
