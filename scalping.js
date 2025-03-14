// scalping.js - Грамотный ТА для ПД (Pussy Destroyer)

// Подключение Binance API
const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";

// Настройка таймфреймов
const timeframes = ["30m", "1h", "4h", "1d"];

// Функция для получения данных по свечам
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

// Функция для расчета RSI
function calculateRSI(data, period) {
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
        let diff = data[i].close - data[i - 1].close;
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
}

// Функция для расчета MACD
function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    function calculateEMA(data, period) {
        let ema = [];
        let multiplier = 2 / (period + 1);
        ema.push(data[0].close);
        for (let i = 1; i < data.length; i++) {
            ema.push((data[i].close - ema[i - 1]) * multiplier + ema[i - 1]);
        }
        return ema;
    }

    let shortEMA = calculateEMA(data, shortPeriod);
    let longEMA = calculateEMA(data, longPeriod);
    let macdLine = shortEMA.map((val, i) => val - longEMA[i]);

    if (macdLine.length < longPeriod) return { macdLine: [], signalLine: [], histogram: [] };
    
    let signalLine = calculateEMA(macdLine.slice(longPeriod), signalPeriod);
    let histogram = macdLine.slice(longPeriod).map((val, i) => val - signalLine[i]);

    return { macdLine: macdLine.slice(longPeriod), signalLine, histogram };
}

// Функция для расчета Bollinger Bands
function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    let upperBand = [], lowerBand = [], sma = [];
    for (let i = period - 1; i < data.length; i++) {
        let slice = data.slice(i - period + 1, i + 1);
        let mean = slice.reduce((acc, val) => acc + val.close, 0) / period;
        let variance = slice.reduce((acc, val) => acc + Math.pow(val.close - mean, 2), 0) / period;
        let std = Math.sqrt(variance);
        let range = variance || 1; 
        upperBand.push(mean + stdDevMultiplier * std);
        lowerBand.push(mean - stdDevMultiplier * std);
        sma.push(mean);
    }
    return { middle: sma, upper: upperBand, lower: lowerBand };
}

// Функция для поиска фигур
function detectPatterns(data) {
    return ["Голова и плечи", "Клин", "Флаг", "Треугольник"].filter(pattern => detectPattern(data, pattern));
}

// Генерация торгового сигнала
function generateSignal(indicators, supportResistance, patterns) {
    let signal = "Ожидаем нормальный сетап.";
    let arguments = [];
    
    let entry, stopLoss, takeProfit;
    
    if (indicators.rsi[indicators.rsi.length - 1] < 30) {
        signal = "Лонг";
        entry = data[data.length - 1].close;
        stopLoss = entry * 0.98;
        takeProfit = entry * 1.05;
        arguments.push("Обнаружена перепроданность");
    }
    
    return { signal, entry, stopLoss, takeProfit, arguments };
}

// Основной анализ
async function analyzeMarket(symbol) {
    console.log(`🔥 Начинаем анализ рынка для ${symbol}`);
    let marketData = await fetchMarketData(symbol, "1h");
    let indicators = {
        rsi: calculateRSI(marketData, 14),
        macd: calculateMACD(marketData),
        bollinger: calculateBollingerBands(marketData)
    };
    let supportResistance = detectSupportResistance(marketData);
    let patterns = detectPatterns(marketData);
    let signal = generateSignal(indicators, supportResistance, patterns);
    console.log("📊 Сигнал:", signal);
    return signal;
}

console.log("🔥 Scalping.js загружен!");
