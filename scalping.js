document.addEventListener("DOMContentLoaded", () => {
    const tradingViewContainer = document.getElementById("tradingview_chart");
    const symbolSelect = document.getElementById("symbol_select");
    const searchInput = document.getElementById("search");

    function loadTradingView(symbol) {
        if (tradingViewContainer.innerHTML !== "") {
            tradingViewContainer.innerHTML = "";
        }
        
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

    function fetchMarketData(symbol) {
        const apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=30m&limit=100`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (!data || data.length < 10) {
                    console.warn("Недостаточно данных для анализа.");
                    return;
                }

                const closes = data.map(d => parseFloat(d[4]));
                const rsi = calculateRSI(closes, 14);
                const currentPrice = closes[closes.length - 1];

                let signal = "Нейтрально";
                let argument = "Цена в нейтральной зоне";

                if (rsi < 30) {
                    signal = "Лонг";
                    argument = "Обнаружена поддержка";
                } else if (rsi > 70) {
                    signal = "Шорт";
                    argument = "Обнаружено сопротивление";
                }

                document.getElementById("signal").innerText = signal;
                document.getElementById("entry").innerText = `$${currentPrice.toFixed(2)}`;
                document.getElementById("stoploss").innerText = `$${(currentPrice * 0.98).toFixed(2)}`;
                document.getElementById("take1").innerText = `$${(currentPrice * 1.02).toFixed(2)}`;
                document.getElementById("argument").innerText = argument;
            })
            .catch(error => console.error("Ошибка получения данных:", error));
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

    symbolSelect.addEventListener("change", () => {
        const selectedSymbol = symbolSelect.value;
        loadTradingView(selectedSymbol);
        fetchMarketData(selectedSymbol);
    });

    searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toUpperCase();
        for (let option of symbolSelect.options) {
            const text = option.textContent.toUpperCase();
            option.hidden = !text.includes(filter);
        }
    });

    loadTradingView("BTCUSDT");
    fetchMarketData("BTCUSDT");
});
