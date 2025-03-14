const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

async function fetchMarketData(symbol, interval, limit = 200) {
    const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.map(k => ({
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
    }));
}

function calculateRSI(closes, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const delta = closes[i] - closes[i - 1];
        if (delta > 0) gains += delta;
        else losses -= delta;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateATR(data, period = 14) {
    let atrSum = 0;
    for (let i = 1; i <= period; i++) {
        atrSum += Math.max(
            data[i].high - data[i].low,
            Math.abs(data[i].high - data[i - 1].close),
            Math.abs(data[i].low - data[i - 1].close)
        );
    }
    return atrSum / period;
}

function detectSupportResistance(data) {
    const highs = data.map(c => c.high);
    const lows = data.map(c => c.low);
    return {
        resistance: Math.max(...highs.slice(-20)),
        support: Math.min(...lows.slice(-20))
    };
}

function analyzeVolume(data) {
    const recentVolume = data[data.length - 1].volume;
    const avgVolume = data.slice(-20).reduce((sum, candle) => sum + candle.volume, 0) / 20;
    return recentVolume > avgVolume * 1.5;
}

function detectPriceAction(data) {
    const lastCandle = data[data.length - 1];
    const candleRange = lastCandle.high - lastCandle.low;
    const bodySize = Math.abs(lastCandle.close - lastCandle.open);

    if (bodySize < candleRange * 0.2) {
        if (lastCandle.close > lastCandle.open) return 'Пин-бар вверх';
        else return 'Пин-бар вниз';
    }
    return 'Нейтрально';
}

async function analyzeMarket(symbol, interval = '30m') {
    const marketData = await fetchMarketData(symbol, interval);

    if (marketData.length < 50) {
        console.warn("Недостаточно данных для анализа");
        return;
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const atr = calculateATR(marketData);
    const { support, resistance } = detectSupportResistance(marketData);
    const highVolume = analyzeVolume(marketData);
    const priceAction = detectPriceAction(marketData);

    const currentPrice = closes[closes.length - 1];

    let signal, entry, stopLoss, takeProfit, argument;

    if ((rsi < 30 && currentPrice <= support) || (priceAction === 'Пин-бар вверх' && highVolume)) {
        signal = 'Лонг';
        entry = currentPrice;
        stopLoss = support - atr;
        takeProfit = resistance;
        argument = `RSI перепродан (${rsi.toFixed(2)}), Прайс экшен: ${priceAction}, Повышенный объем`;
    } else if ((rsi > 70 && currentPrice >= resistance) || (priceAction === 'Пин-бар вниз' && highVolume)) {
        signal = 'Шорт';
        entry = currentPrice;
        stopLoss = resistance + atr;
        takeProfit = support;
        argument = `RSI перекуплен (${rsi.toFixed(2)}), Прайс экшен: ${priceAction}, Повышенный объем`;
    } else if (currentPrice > support && currentPrice < resistance) {
        signal = 'Нейтрально';
        entry = null;
        stopLoss = null;
        takeProfit = null;
        argument = 'Цена в нейтральной зоне';
    } else {
        signal = currentPrice >= resistance ? 'Шорт' : 'Лонг';
        entry = currentPrice;
        stopLoss = currentPrice >= resistance ? resistance + atr : support - atr;
        takeProfit = currentPrice >= resistance ? support : resistance;
        argument = 'Цена у ключевого уровня';
    }

    return {
        symbol,
        signal,
        entry: entry ? entry.toFixed(2) : 'Нет входа',
        stopLoss: stopLoss ? stopLoss.toFixed(2) : 'Не применимо',
        takeProfit: takeProfit ? takeProfit.toFixed(2) : 'Не применимо',
        argument
    };
}

// Использование
analyzeMarket('BTCUSDT').then(console.log).catch(console.error);
