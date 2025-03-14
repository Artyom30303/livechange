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
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

function calculateRSI(data, period = 14) {
    if (data.length <= period) return null;

    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i].close - data[i - 1].close;
        diff > 0 ? gains += diff : losses -= diff;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period || 1;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateEMA(data, period) {
    let ema = [data[0].close];
    const k = 2 / (period + 1);

    for (let i = 1; i < data.length; i++) {
        ema.push(data[i].close * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    const shortEMA = calculateEMA(data, shortPeriod);
    const longEMA = calculateEMA(data, longPeriod);

    const macdLine = shortEMA.map((val, idx) => val - longEMA[idx]);
    const signalLine = calculateEMA(macdLine.slice(longPeriod - 1), signalPeriod);
    const histogram = macdLine.slice(longPeriod - 1).map((v, i) => v - signalLine[i]);

    return { macdLine, signalLine, histogram };
}

function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    let sma = [], upperBand = [], lowerBand = [];

    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
        const stdDev = Math.sqrt(slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period);

        sma.push(mean);
        upperBand.push(mean + stdDevMultiplier * stdDev);
        lowerBand.push(mean - stdDevMultiplier * stdDev);
    }

    return { middle: sma, upper: upperBand, lower: lowerBand };
}

function detectSupportResistance(data) {
    const recentLows = data.slice(-20).map(c => c.low);
    const recentHighs = data.slice(-20).map(c => c.high);

    return {
        support: Math.min(...recentLows),
        resistance: Math.max(...recentHighs)
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

function generateSignalObject(data, indicators, signalType) {
    const price = data[data.length - 1].close;
    const { support, resistance } = indicators.levels;

    return {
        signal: signalType,
        entry: price,
        stopLoss: signalType === "Лонг" ? support : resistance,
        takeProfit: signalType === "Лонг" ? resistance : support,
        arguments: signalType === "Лонг" ? "Обнаружена поддержка" : "Обнаружено сопротивление"
    };
}

window.analyzeMarket = async (symbol, interval = '30m') => {
    const marketData = await fetchMarketData(symbol, interval);
    const indicators = await calculateIndicators(marketData);

    let signalType = null;
    if (indicators.rsi && indicators.rsi < 30) signalType = "Лонг";
    else if (indicators.rsi && indicators.rsi > 70) signalType = "Шорт";

    const analysisResult = generateSignalObject(marketData, indicators, signalType);
    console.log("Итоговый анализ:", analysisResult);
    return analysisResult;
};
