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

// === Функция для расчета индикаторов ===
function calculateIndicators(data) {
    return {
        rsi: calculateRSI(data, 14),
        macd: calculateMACD(data, 12, 26, 9),
        bollinger: calculateBollingerBands(data, 20, 2),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data, 14, 3, 3)
    };
}

// === Функция для определения зон поддержки/сопротивления ===
function detectSupportResistance(data) {
    return detectPOC(data).concat(detectLiquidityClusters(data));
}

// === Функция для поиска фигур ===
function detectPatterns(data) {
    return ["Голова и плечи", "Клин", "Флаг", "Треугольник"].filter(pattern => detectPattern(data, pattern));
}

// === Генерация торгового сигнала ===
function generateSignal(data, indicators, supportResistance, patterns) {
    let signal = "Ожидаем нормальный сетап.";
    let arguments = [];
    let entry, stopLoss, takeProfit;

    if (patterns.includes("Голова и плечи")) {
        signal = "Шорт";
        entry = data[data.length - 1].close;
        stopLoss = entry * 1.03;
        takeProfit = entry * 0.95;
        arguments.push("Обнаружена фигура 'Голова и плечи', ожидаем подтверждения!");
    } else if (patterns.includes("Флаг")) {
        signal = "Лонг";
        entry = data[data.length - 1].close;
        stopLoss = entry * 0.97;
        takeProfit = entry * 1.05;
        arguments.push("Флаг подтвержден, заходим в лонг!");
    }
    
    if (indicators.rsi < 30) arguments.push("RSI в зоне перепроданности, возможен отскок.");
    if (indicators.stochastic < 20) arguments.push("Стохастик в зоне перепроданности, дополнительное подтверждение.");

    return { signal, entry, stopLoss, takeProfit, arguments };
}

// === Основной анализ рынка ===
async function analyzeMarket(symbol) {
    console.log(`🔥 Начинаем анализ рынка для ${symbol}`);
    const marketData = await fetchMarketData(symbol, "30m");
    const indicators = calculateIndicators(marketData);
    const supportResistance = detectSupportResistance(marketData);
    const patterns = detectPatterns(marketData);
    const tradingSignal = generateSignal(marketData, indicators, supportResistance, patterns);
    
    displaySignal(tradingSignal);
}

// === Отображение сигнала ===
function displaySignal(signalData) {
    document.getElementById("analysis-content").innerHTML = `
        <h3>🔥 Pump & Dump Club</h3>
        <p><b>Сигнал:</b> ${signalData.signal}</p>
        <p><b>Точка входа:</b> ${signalData.entry?.toFixed(2) || "-"}</p>
        <p><b>Стоп-лосс:</b> ${signalData.stopLoss?.toFixed(2) || "-"}</p>
        <p><b>Тейк-профит:</b> ${signalData.takeProfit?.toFixed(2) || "-"}</p>
        <p><b>Аргументы:</b> ${signalData.arguments.join("<br>")}</p>
    `;
}

// === Запуск анализа ===
analyzeMarket("BTCUSDT");
