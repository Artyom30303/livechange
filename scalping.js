const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

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

async function analyzeMarket(symbol, interval = '30m') {
    const marketData = await fetchMarketData(symbol, interval);
    if (!marketData || marketData.length < 50) {
        console.warn("Недостаточно данных для анализа");
        document.getElementById("market_analysis").innerText = "Ошибка: недостаточно данных";
        return;
    }

    const closes = marketData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const currentPrice = closes[closes.length - 1];
    let signal = rsi < 30 ? 'Лонг' : rsi > 70 ? 'Шорт' : 'Нейтрально';
    let argument = rsi < 30 ? "Перепроданность" : rsi > 70 ? "Перекупленность" : "Цена в нейтральной зоне";
    
    console.log("📊 Результат анализа:", { symbol, signal, rsi: rsi.toFixed(2), currentPrice });
    document.getElementById("market_analysis").innerHTML = `
        <strong>📌 Сигнал:</strong> ${signal} <br>
        <strong>📊 RSI:</strong> ${rsi.toFixed(2)} <br>
        <strong>💰 Цена:</strong> ${currentPrice.toFixed(5)} <br>
        <strong>📉 Аргумент:</strong> ${argument}
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "DOGEUSDT", "SOLUSDT", "XRPUSDT"];
    const symbolSelect = document.getElementById("symbol_select");
    const searchBox = document.getElementById("search_box");
    
    symbols.forEach(symbol => {
        const option = document.createElement("option");
        option.value = symbol;
        option.textContent = symbol.replace("USDT", " / USDT");
        symbolSelect.appendChild(option);
    });

    searchBox.addEventListener("input", () => {
        const query = searchBox.value.toUpperCase();
        for (let option of symbolSelect.options) {
            option.hidden = !option.value.includes(query);
        }
    });

    symbolSelect.addEventListener("change", (event) => {
        analyzeMarket(event.target.value);
    });

    analyzeMarket("BTCUSDT");
});
