// scalping.js - Полный алгоритм Pussy Destroyer 2.0 (глубокий и дерзкий анализ)

const BINANCE_API_URL = "https://api.binance.com/api/v3/klines";
const timeframes = ["30m", "1h", "4h", "1d"];

async function fetchMarketData(symbol, interval) {
    const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;
    const response = await fetch(url);
    const data = await response.json();
    return data.map(c => ({
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
    });
}

function calculateIndicators(data) {
    return {
        rsi: calculateRSI(data, 14),
        macd: calculateMACD(data, 12, 26, 9),
        bollinger: calculateBollingerBands(data, 20, 2),
        obv: calculateOBV(data),
        stochastic: calculateStochastic(data, 14, 3, 3),
    };
}

function detectSupportResistance(data) {
    return detectPOC(data).concat(detectLiquidityClusters(data));
}

function detectPatterns(data) {
    return ["Голова и плечи", "Клин", "Флаг", "Треугольник"].filter(pattern => detectPattern(data, pattern));
}

function generateSignal(data, indicators, levels, patterns) {
    let signal = "Ожидаем нормальный сетап";
    let entry, stopLoss, takeProfit, arguments;

    let currentRSI = indicators.rsi[indicators.rsi.length - 1];
    let stochastic = indicators.stochastic[indicators.stochastic.length - 1];

    if (currentPriceAboveSupport(data, levels) && currentPriceBelowResistance(data, levels)) {
        signal = "Ожидание, боковик. Не лезь пока";
        arguments = "Цена во флете, ждать чёткого пробоя уровня!";
    } else if (currentPriceAboveSupport(data, levels) && (currentPriceBelowResistance(data, levels) == false || stochastic < 20 || currentPriceAbovePOC(data))) {
        signal = "Лонг";
        arguments = `Цена на поддержке, RSI: ${currentRSI}, Стохастик: ${stochastic}. Хороший вход на лонг.`;
    } else if (currentPriceBelowResistance(data, levels)) {
        signal = "Шорт";
        arguments = `Цена упёрлась в сопротивление, RSI: ${currentRSI}, Стохастик: ${stochastic}. Хороший вход на шорт.`;
    }

    let entry = data[data.length - 1].close;
    let stopLoss = calculateAdaptiveStopLoss(data, signal);
    let takeProfit = calculateAdaptiveTakeProfit(data, signal);

    return { signal, entry: entry.toFixed(2), stopLoss: stopLoss.toFixed(2), takeProfit: takeProfit.toFixed(2), arguments };
}

async function analyzeMarket(symbol) {
    console.log(`🔥 Начинаем анализ рынка для ${symbol}`);
    let interval = '30m';
    let marketData = await fetchMarketData(symbol, interval);
    let indicators = calculateIndicators(marketData);
    let levels = detectSupportResistance(marketData);
    let patterns = detectPatterns(marketData);
    let signalData = generateSignal(marketData, indicators, levels, patterns);

    displaySignal(signalData);
}

function displaySignal({signal, entry, stopLoss, takeProfit, arguments}) {
    const signalPanel = document.getElementById('signal-panel');
    signalPanel.innerHTML = `
        <h3>🔥 Pump & Dump Club</h3>
        <p><strong>📈 Сигнал:</strong> ${signal}</p>
        <p>🎯 <strong>Точка входа:</strong> $${entry}</p>
        <p>🛑 <strong>Стоп-лосс:</strong> $${stopLoss}</p>
        <p>🎯 <strong>Тейк 1:</strong> $${takeProfit}</p>
        <p>📌 <strong>Аргументы:</strong> ${arguments}</p>
    `;
}

// Запуск
analyzeMarket("BTCUSDT");
