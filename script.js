const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

async function fetchMarketData(symbol, interval, limit = 50) {
    try {
        const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Недостаточно данных от Binance");
        return data.map(k => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    } catch (error) {
        console.error("Ошибка загрузки данных Binance:", error);
        return [];
    }
}

function calculateRSI(closes, period = 14) {
    if (closes.length < period) return null;
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
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

async function analyzeMarket(symbol, interval = '30m') {
    const marketData = await fetchMarketData(symbol, interval);
    if (!marketData || marketData.length < 20) {
        console.warn("Недостаточно данных для анализа");
        return;
    }
    
    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    if (rsi === null) return;
    const currentPrice = closes[closes.length - 1];
    let signal = rsi < 30 ? 'Лонг' : rsi > 70 ? 'Шорт' : 'Нейтрально';
    let argument = rsi < 30 ? 'Перепроданность, возможен рост' : rsi > 70 ? 'Перекупленность, возможен спад' : 'Цена в нейтральной зоне';
    
    if (document.getElementById("signal")) document.getElementById("signal").innerText = signal;
    if (document.getElementById("rsi")) document.getElementById("rsi").innerText = rsi.toFixed(2);
    if (document.getElementById("price")) document.getElementById("price").innerText = currentPrice.toFixed(2);
    if (document.getElementById("argument")) document.getElementById("argument").innerText = argument;
}

document.addEventListener("DOMContentLoaded", () => {
    analyzeMarket('BTCUSDT');
    
    if (typeof TradingView !== 'undefined') {
        new TradingView.widget({
            "container_id": "tradingview_chart",
            "symbol": "BINANCE:BTCUSDT",
            "interval": "30",
            "theme": "light",
            "style": "1",
            "locale": "ru",
            "width": "100%",
            "height": "400px",
            "enable_publishing": false,
            "allow_symbol_change": true
        });
    } else {
        console.error("Ошибка загрузки TradingView");
    }
    
    const symbolSelect = document.getElementById("symbol_select");
    if (symbolSelect) {
        symbolSelect.addEventListener("change", (event) => {
            analyzeMarket(event.target.value);
        });
    }
});
