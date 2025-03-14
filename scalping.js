// API Binance
const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

// Функция для получения данных по рынку
async function fetchMarketData(symbol, interval, limit = 100) {
    try {
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
    } catch (error) {
        console.error("Ошибка получения данных с Binance:", error);
    }
}

// Функция расчета RSI
function calculateRSI(closes, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
        let delta = closes[i] - closes[i - 1];
        if (delta > 0) gains += delta;
        else losses -= delta;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period || 1;
    let rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Основная логика анализа
async function analyzeMarket(symbol, interval = '30m') {
    const marketData = await fetchMarketData(symbol, interval);
    if (!marketData || marketData.length < 50) {
        console.warn("Недостаточно данных для анализа");
        document.getElementById("signal").innerText = "Ошибка: недостаточно данных";
        return;
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const currentPrice = closes[closes.length - 1];

    let signal = rsi < 30 ? "Лонг" : rsi > 70 ? "Шорт" : "Нейтрально";
    let argument = signal === "Лонг" ? "Обнаружена поддержка" : 
                   signal === "Шорт" ? "Сопротивление на уровне цены" : 
                   "Цена в нейтральной зоне";

    document.getElementById("signal").innerText = signal;
    document.getElementById("entry").innerText = `$${(currentPrice * 1.002).toFixed(2)}`;
    document.getElementById("stoploss").innerText = `$${(currentPrice * 0.98).toFixed(2)}`;
    document.getElementById("take1").innerText = `$${(currentPrice * 1.03).toFixed(2)}`;
    document.getElementById("argument").innerText = argument;

    console.log("📊 Результат анализа:", { symbol, signal, rsi: rsi.toFixed(2), currentPrice });
}

// Загружаем график TradingView
document.addEventListener("DOMContentLoaded", () => {
    analyzeMarket("BTCUSDT");

    new TradingView.widget({
        "container_id": "tradingview_chart",
        "symbol": "BINANCE:BTCUSDT",
        "interval": "30",
        "theme": "light",
        "style": "1",
        "locale": "ru",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "allow_symbol_change": true,
        "show_popup_button": true,
        "width": "100%",
        "height": "500px"
    });

    // Восстанавливаем выпадающий список и панель поиска монет
    const symbolSelect = document.getElementById("symbol_select");
    if (symbolSelect) {
        symbolSelect.addEventListener("change", (event) => {
            const selectedSymbol = event.target.value;
            analyzeMarket(selectedSymbol);
        });
    }
});
