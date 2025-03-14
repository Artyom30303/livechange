const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';
const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "DOGEUSDT", "SOLUSDT"];

document.addEventListener("DOMContentLoaded", () => {
    const symbolSelect = document.getElementById("symbol_select");
    const searchInput = document.getElementById("search_input");
    
    // Заполняем список доступных символов
    symbols.forEach(symbol => {
        let option = document.createElement("option");
        option.value = symbol;
        option.textContent = symbol;
        symbolSelect.appendChild(option);
    });
    
    // Фильтр поиска монет
    searchInput.addEventListener("input", () => {
        let filter = searchInput.value.toUpperCase();
        symbolSelect.innerHTML = "";
        symbols.filter(symbol => symbol.includes(filter)).forEach(symbol => {
            let option = document.createElement("option");
            option.value = symbol;
            option.textContent = symbol;
            symbolSelect.appendChild(option);
        });
    });

    // Анализ рынка при изменении монеты
    symbolSelect.addEventListener("change", () => analyzeMarket(symbolSelect.value));

    // Инициализация с BTCUSDT
    analyzeMarket("BTCUSDT");
    loadTradingView("BTCUSDT");
});

async function fetchMarketData(symbol, interval = "30m", limit = 50) {
    try {
        const url = `${BINANCE_API_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.map(k => ({ close: parseFloat(k[4]) }));
    } catch (error) {
        console.error("Ошибка получения данных с Binance:", error);
    }
}

function calculateRSI(closes, period = 14) {
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

async function analyzeMarket(symbol) {
    const marketData = await fetchMarketData(symbol);
    if (!marketData || marketData.length < 14) {
        console.warn("Недостаточно данных для анализа");
        return;
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const currentPrice = closes[closes.length - 1];
    let signal = rsi < 30 ? 'Лонг' : rsi > 70 ? 'Шорт' : 'Нейтрально';
    let argument = rsi < 30 ? "Перепроданность - возможен рост" : rsi > 70 ? "Перекупленность - возможен спад" : "Цена в нейтральной зоне";
    
    document.getElementById("signal").innerText = signal;
    document.getElementById("rsi").innerText = rsi.toFixed(2);
    document.getElementById("price").innerText = currentPrice.toFixed(2);
    document.getElementById("argument").innerText = argument;
}

function loadTradingView(symbol) {
    new TradingView.widget({
        "container_id": "tradingview_chart",
        "symbol": `BINANCE:${symbol}`,
        "interval": "30",
        "theme": "light",
        "style": "1",
        "locale": "ru",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "allow_symbol_change": true,
        "width": "100%",
        "height": "400px"
    });
}
