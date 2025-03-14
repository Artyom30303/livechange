// scalping.js

const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";

const timeframes = ["30m", "1h", "4h", "1d"];

async function fetchMarketData(symbol, interval) {
    const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;
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

function calculateIndicators(data) {
    return {
        rsi: calculateRSI(data, 14),
        macd: calculateMACD(data, 12, 26, 9),
        bollinger: calculateBollingerBands(data, 14, 2),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data, 14, 3, 3)
    };
}

function generateSignal(data, indicators) {
    let signal = "Ожидаем нормальный сетап";
    let entry, stopLoss, takeProfit;

    const lastRSI = indicators.rsi[indicators.rsi.length - 1];

    if (indicators.rsi[indicators.rsi.length - 1] < 30 && indicators.stochastic.K < 20) {
        signal = "Лонг";
        entry = data[data.length - 1].close;
        stopLoss = entry * 0.98;
        takeProfit = entry * 1.02;
    } else if (indicators.rsi[indicators.rsi.length - 1] > 70 && indicators.stochastic.K > 80) {
        signal = "Шорт";
        entry = data[data.length - 1].close;
        stopLoss = entry * 1.02;
        takeProfit = entry * 0.98;
    }

    return { signal, entry, stopLoss, takeProfit };
}

async function analyzeMarket(symbol) {
    console.log("🔥 Начинаем анализ рынка для", symbol);

    const data = await fetchMarketData(symbol, "30m");
    const indicators = calculateIndicators(data);

    const { signal, entry, stopLoss, takeProfit } = generateSignal(data, indicators);

    console.log(`✅ Сигнал: ${signal}, вход: ${entry}, SL: ${stopLoss}, TP: ${takeProfit}`);
}

// Экспортируем функции в глобальный контекст
window.fetchMarketData = fetchMarketData;
window.analyzeMarket = analyzeMarket;
window.calculateIndicators = calculateIndicators;
window.generateSignal = generateSignal;
