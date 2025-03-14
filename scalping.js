const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

// Загрузка данных с Binance
async function fetchMarketData(symbol, interval, limit = 100) {
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

// Расчёт RSI
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

// Анализ рынка только по RSI
async function analyzeMarket(symbol, interval = '30m') {
    const marketData = await fetchMarketData(symbol, interval);
    if (marketData.length < 20) {
        return { signal: 'Недостаточно данных' };
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);

    let signal;
    if (rsi < 30) {
        signal = 'Лонг';
    } else if (rsi > 70) {
        signal = 'Шорт';
    } else {
        signal = 'Нейтрально';
    }

    return {
        symbol,
        signal,
        rsi: rsi.toFixed(2),
        currentPrice: closes[closes.length - 1].toFixed(2),
        argument: `RSI: ${rsi.toFixed(2)}`
    };
}

// Пример запуска:
analyzeMarket('BTCUSDT').then(result => {
    console.log('Результат RSI анализа:', result);
}).catch(e => console.error(e));
