document.addEventListener("DOMContentLoaded", async function () {
    const symbolSelect = document.getElementById("symbol_select");
    const searchInput = document.getElementById("search");
    const tradingViewContainer = document.getElementById("tradingview_chart");
    
    function loadTradingView(symbol) {
        tradingViewContainer.innerHTML = "";
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
            "height": "500px"
        });
    }
    
    async function fetchMarketData(symbol) {
        try {
            const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1h&limit=100`;
            const response = await fetch(url);
            const data = await response.json();
            return data.map(k => parseFloat(k[4]));
        } catch (error) {
            console.error("Ошибка загрузки данных с Binance", error);
            return null;
        }
    }
    
    function calculateRSI(closes, period = 14) {
        let gains = 0, losses = 0;
        for (let i = 1; i < period; i++) {
            let delta = closes[i] - closes[i - 1];
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
        const closes = marketData;
        const rsi = calculateRSI(closes);
        const currentPrice = closes[closes.length - 1];
        
        let signal = rsi < 30 ? "Лонг" : rsi > 70 ? "Шорт" : "Нейтрально";
        let entry = currentPrice;
        let stoploss = signal === "Лонг" ? currentPrice * 0.98 : currentPrice * 1.02;
        let take1 = signal === "Лонг" ? currentPrice * 1.03 : currentPrice * 0.97;
        let argument = signal === "Лонг" ? "Обнаружена поддержка" : signal === "Шорт" ? "Обнаружено сопротивление" : "Цена в нейтральной зоне";
        
        document.getElementById("signal").innerText = signal;
        document.getElementById("rsi").innerText = rsi.toFixed(2);
        document.getElementById("price").innerText = currentPrice.toFixed(2);
        document.getElementById("entry").innerText = `$${entry.toFixed(2)}`;
        document.getElementById("stoploss").innerText = `$${stoploss.toFixed(2)}`;
        document.getElementById("take1").innerText = `$${take1.toFixed(2)}`;
        document.getElementById("argument").innerText = argument;
    }
    
    symbolSelect.addEventListener("change", (event) => {
        const selectedSymbol = event.target.value;
        loadTradingView(selectedSymbol);
        analyzeMarket(selectedSymbol);
    });
    
    searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toUpperCase();
        for (let option of symbolSelect.options) {
            let text = option.text.toUpperCase();
            option.style.display = text.includes(filter) ? "block" : "none";
        }
    });
    
    loadTradingView("BTCUSDT");
    analyzeMarket("BTCUSDT");
});
