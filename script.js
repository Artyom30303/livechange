document.addEventListener("DOMContentLoaded", async function () {
    console.log("📜 JS загружен!");

    const coinSelect = document.getElementById("coin-select");
    const searchCoin = document.getElementById("search-coin");
    const chartContainer = document.getElementById("chart-container");
    const signalsDiv = document.getElementById("signals");

    const BINANCE_API = "https://api.binance.com/api/v3/ticker/24hr";
    const coins = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "SOLUSDT", "DOGEUSDT"];

    function updateCoinList() {
        coinSelect.innerHTML = "";
        coins.forEach(coin => {
            let option = document.createElement("option");
            option.value = coin;
            option.textContent = coin;
            coinSelect.appendChild(option);
        });
    }

    searchCoin.addEventListener("input", function () {
        let searchText = this.value.toUpperCase();
        coinSelect.innerHTML = "";
        coins
            .filter(coin => coin.includes(searchText))
            .forEach(coin => {
                let option = document.createElement("option");
                option.value = coin;
                option.textContent = coin;
                coinSelect.appendChild(option);
            });
    });

    async function fetchBinanceData(symbol) {
        try {
            let response = await fetch(`${BINANCE_API}?symbol=${symbol}`);
            let data = await response.json();
            return {
                price: parseFloat(data.lastPrice).toFixed(2),
                high: parseFloat(data.highPrice).toFixed(2),
                low: parseFloat(data.lowPrice).toFixed(2),
            };
        } catch (error) {
            console.error("❌ Ошибка API Binance:", error);
            return null;
        }
    }

    function loadChart(symbol) {
        chartContainer.innerHTML = `<iframe src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=30" width="100%" height="450px" frameborder="0"></iframe>`;
    }

    async function loadSignals(symbol) {
        let marketData = await fetchBinanceData(symbol);
        if (!marketData) {
            signalsDiv.innerHTML = "<p>❌ Ошибка данных.</p>";
            return;
        }

        let { price, high, low } = marketData;
        let trend = price > ((parseFloat(high) + parseFloat(low)) / 2) ? "Лонг" : "Шорт";
        let stopLoss = trend === "Лонг" ? (price * 0.98).toFixed(2) : (price * 1.02).toFixed(2);
        let takeProfit1 = trend === "Лонг" ? (price * 1.02).toFixed(2) : (price * 0.98).toFixed(2);
        let argument = trend === "Лонг" ? "Обнаружена поддержка" : "Сопротивление, вероятен шорт";

        signalsDiv.innerHTML = `
            <p><strong>📉 Сигнал:</strong> ${trend}</p>
            <p>📍 <strong>Точка входа:</strong> $${price}</p>
            <p>🛑 <strong>Стоп-лосс:</strong> $${stopLoss}</p>
            <p>🎯 <strong>Тейк 1:</strong> $${takeProfit1}</p>
            <p>📌 <strong>Аргументы:</strong> ${argument}</p>
        `;
    }

    updateCoinList();
    coinSelect.addEventListener("change", function () {
        loadChart(this.value);
        loadSignals(this.value);
    });

    loadChart("BTCUSDT");
    loadSignals("BTCUSDT");
});
