document.addEventListener("DOMContentLoaded", function () {
    console.log("📜 JS загружен!");

    const coinSelect = document.getElementById("coin-select");
    const searchCoin = document.getElementById("search-coin");
    const selectedCoin = document.getElementById("selected-coin");
    const chartContainer = document.getElementById("chart-container");
    const signalsDiv = document.getElementById("signals");

    // Доступные монеты
    const coins = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];

    // Заполняем список монет
    function loadCoins() {
        coinSelect.innerHTML = "";
        coins.forEach(coin => {
            let option = document.createElement("option");
            option.value = coin;
            option.textContent = coin;
            coinSelect.appendChild(option);
        });
    }

    // Фильтр по поиску
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

    // Обновляем график
    function loadChart(symbol) {
        chartContainer.innerHTML = `<p class="loading-text">📉 График загружается...</p>`;
        selectedCoin.textContent = symbol;

        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.async = true;

        script.innerHTML = JSON.stringify({
            "symbol": `BINANCE:${symbol}`,
            "width": "100%",
            "height": 500,
            "interval": "30",
            "theme": "light",
            "style": "1",
            "locale": "ru",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "container_id": "chart-container"
        });

        chartContainer.appendChild(script);
    }

    // Обновляем сигналы
    function loadSignals(symbol) {
        console.log("📊 Начинаем анализ рынка для", symbol);

        let signalHTML = `
            <p><strong>📉 Сигнал:</strong> Готовимся к шорту!</p>
            <p>📍 <strong>Точка входа:</strong> $${(Math.random() * 50000).toFixed(2)}</p>
            <p>🛑 <strong>Стоп-лосс:</strong> $${(Math.random() * 50000).toFixed(2)}</p>
            <p>🎯 <strong>Тейк 1:</strong> $${(Math.random() * 50000).toFixed(2)}</p>
            <p>🎯 <strong>Тейк 2:</strong> $${(Math.random() * 50000).toFixed(2)}</p>
            <p>🎯 <strong>Тейк 3:</strong> $${(Math.random() * 50000).toFixed(2)}</p>
            <p>📌 <strong>Аргументы:</strong> Ожидаем дивергенцию RSI!</p>
        `;

        signalsDiv.innerHTML = signalHTML;
    }

    // Смена монеты
    coinSelect.addEventListener("change", function () {
        let symbol = this.value;
        loadChart(symbol);
        loadSignals(symbol);
    });

    // Загружаем стартовые данные
    loadCoins();
    loadChart("BTCUSDT");
    loadSignals("BTCUSDT");
});
