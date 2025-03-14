const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

async function fetchMarketData(symbol, interval = '30m') {
    const response = await fetch(`${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`);
    const data = await response.json();
    return data.map(d => ({
        open: +d[1],
        high: +d[2],
        low: +d[3],
        close: +d[4],
        volume: +d[5]
    }));
}

// RSI calculation
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

    let rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Bollinger Bands
function calculateBollingerBands(data, period = 20) {
    if (data.length < period) return null;

    let closes = data.slice(-period).map(d => d.close);
    let mean = closes.reduce((acc, val) => acc + val, 0) / period;
    let std = Math.sqrt(closes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period);

    return {
        upper: mean + std * 2,
        middle: mean,
        lower: mean - std * 2
    };
}

// MACD
function calculateEMA(data, period) {
    let multiplier = 2 / (period + 1);
    return data.reduce((acc, val, i) => {
        if (i === 0) return [val.close];
        acc.push((val.close - acc[i - 1]) * multiplier + acc[i - 1]);
        return acc;
    }, []);
}

function calculateMACD(data) {
    const shortEMA = calculateEMA(data, 12);
    const longEMA = calculateEMA(data, 26);

    let macdLine = shortEMA.map((val, idx) => val - longEMA[idx]);
    let signalLine = calculateEMA(macdLine.slice(-9).map(val => ({ close: val })), 9);

    return {
        macd: macdLine[macdLine.length - 1],
        signal: signalLine[signalLine.length - 1]
    };
}

// Support & Resistance detection
function detectSupportResistance(data) {
    let highs = data.map(d => d.high);
    let lows = data.map(d => d.low);

    return {
        resistance: Math.max(...highs.slice(-20)),
        support: Math.min(...lows.slice(-20))
    };
}

// Main analysis function
async function analyzeMarket(symbol) {
    let data = await fetchMarketData(symbol);

    let rsi = calculateRSI(data);
    let macd = calculateMACD(data);
    let bollinger = calculateBollingerBands(data);
    let srLevels = detectSupportResistance(data);

    let lastClose = data[data.length - 1].close;
    let entry, stopLoss, takeProfit, signal, arguments;

    if (rsi < 30 && macd.macd > macd.signal && lastClose < bollinger.lower && lastClose <= srLevels.support * 1.01) {
        signal = "Лонг";
        entry = lastClose;
        stopLoss = srLevels.support * 0.98;
        takeProfit = srLevels.resistance * 0.995;
        arguments = "RSI перепроданность, MACD разворот, цена у нижней линии Боллинджера, поддержка рядом";
    } else if (rsi > 70 && macd.macd < macd.signal && lastClose > bollinger.upper && lastClose >= srLevels.resistance * 0.99) {
        signal = "Шорт";
        entry = lastClose;
        stopLoss = srLevels.resistance * 1.02;
        takeProfit = srLevels.support * 1.005;
        arguments = "RSI перекупленность, MACD разворот вниз, цена у верхней линии Боллинджера, сопротивление рядом";
    } else {
        signal = "Нет входа";
        arguments = "Нет уверенного сигнала на вход по текущим условиям";
    }

    return {
        symbol,
        signal,
        entry: entry?.toFixed(2),
        stopLoss: stopLoss?.toFixed(2),
        takeProfit: takeProfit?.toFixed(2),
        arguments
    };
}

window.analyzeMarket = analyzeMarket;
