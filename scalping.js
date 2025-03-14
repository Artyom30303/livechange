const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

// Получение данных о рынке
async function fetchMarketData(symbol, interval = '30m', limit = 100) {
    try {
        const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error("Ошибка данных Binance API:", data);
            return [];
        }

        return data.map(k => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    } catch (error) {
        console.error("Ошибка получения данных с Binance:", error);
        return [];
    }
}

// Расчет RSI
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

// Анализ рынка
async function analyzeMarket(symbol) {
    const marketData = await fetchMarketData(symbol);

    if (!marketData || marketData.length < 50) {
        console.warn("Недостаточно данных для анализа");
        document.getElementById("market_analysis").innerText = "Ошибка: недостаточно данных";
        return;
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const currentPrice = closes[closes.length - 1];

    let signal = "Нейтрально";
    if (rsi !== null) {
        if (rsi < 30) signal = "Лонг";
        else if (rsi > 70) signal = "Шорт";
    }

    console.log("📊 Результат анализа:", { symbol, signal, rsi: rsi?.toFixed(2), currentPrice });

    document.getElementById("market_analysis").innerText = 
        `Сигнал: ${signal} | RSI: ${rsi?.toFixed(2)} | Цена: ${currentPrice.toFixed(2)}`;
}

// Загрузка TradingView
function loadTradingView(symbol) {
    if (typeof TradingView === "undefined") {
        console.error("TradingView не загружен!");
        return;
    }

    new TradingView.widget({
        "container_id": "tradingview_chart",
        "symbol": `BINANCE:${symbol}`,
        "interval": "30",
        "theme": "dark",
        "style": "1",
        "locale": "ru",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "allow_symbol_change": true,
        "show_popup_button": true,
        "width": "100%",
        "height": "400px"
    });
}

// Инициализация страницы
document.addEventListener("DOMContentLoaded", () => {
    const defaultSymbol = "BTCUSDT";
    analyzeMarket(defaultSymbol);
    loadTradingView(defaultSymbol);

    // Обработчик смены монеты
    const symbolSelect = document.getElementById("symbol_select");
    if (symbolSelect) {
        symbolSelect.addEventListener("change", (event) => {
            const selectedSymbol = event.target.value;
            analyzeMarket(selectedSymbol);
            loadTradingView(selectedSymbol);
        });
    }
});
