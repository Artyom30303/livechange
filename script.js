document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ JS загружен!");

    const tradingViewContainer = document.getElementById("tradingview-widget");
    const coinSelect = document.getElementById("coinSelect");
    const searchInput = document.getElementById("search");

    const coins = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "SOLUSDT", "MATICUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT"];

    // Наполняем селект монетами
    function populateCoinList() {
        coinSelect.innerHTML = "";
        coins.forEach(coin => {
            let option = document.createElement("option");
            option.value = coin;
            option.textContent = coin;
            coinSelect.appendChild(option);
        });
    }
    populateCoinList();

    // Фильтрация монет
    searchInput.addEventListener("input", function () {
        let searchValue = searchInput.value.toUpperCase();
        coinSelect.innerHTML = "";
        coins.forEach(coin => {
            if (coin.includes(searchValue)) {
                let option = document.createElement("option");
                option.value = coin;
                option.textContent = coin;
                coinSelect.appendChild(option);
            }
        });
    });

    // Функция загрузки TradingView
    function loadTradingView(symbol) {
        console.log(`📈 Загружаем график для ${symbol}`);

        tradingViewContainer.innerHTML = `<iframe src="https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}" 
            width="100%" height="500px" frameborder="0"></iframe>`;
    }

    // Анализ рынка (улучшенный)
    function analyzeMarket(symbol) {
        console.log(`🔍 Начинаем анализ рынка для ${symbol}`);

        // Симуляция задержки запроса API Binance
        setTimeout(() => {
            const entryPrice = (Math.random() * (1600 - 1400) + 1400).toFixed(2);
            const stopLoss = (entryPrice * 0.97).toFixed(2);
            const takeProfit1 = (entryPrice * 1.02).toFixed(2);
            const takeProfit2 = (entryPrice * 1.04).toFixed(2);
            const takeProfit3 = (entryPrice * 1.06).toFixed(2);

            document.getElementById("analysis-content").innerHTML = `
                <p><strong>Сигнал:</strong> 📉 Готовимся к шорту!</p>
                <p>📍 Точка входа: <strong>$${entryPrice}</strong></p>
                <p>🛑 Стоп-лосс: <strong>$${stopLoss}</strong></p>
                <p>🎯 Тейк 1: <strong>$${takeProfit1}</strong></p>
                <p>🎯 Тейк 2: <strong>$${takeProfit2}</strong></p>
                <p>🎯 Тейк 3: <strong>$${takeProfit3}</strong></p>
                <p><strong>📌 Аргументы:</strong> 🟥 Обнаружена дивергенция RSI, ждём подтверждения!</p>
            `;
        }, 1500);
    }

    // Обработчик выбора монеты
    coinSelect.addEventListener("change", function () {
        const selectedCoin = coinSelect.value;
        document.getElementById("pair").textContent = selectedCoin;
        loadTradingView(selectedCoin);
        analyzeMarket(selectedCoin);
    });

    // Загрузка по умолчанию
    loadTradingView("BTCUSDT");
    analyzeMarket("BTCUSDT");
});
