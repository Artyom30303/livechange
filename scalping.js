document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const coinList = document.getElementById("coinList");
  const signalDisplay = document.getElementById("signalDisplay");

  let coins = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT",
    "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "TONUSDT", "NEARUSDT"
  ];

  // Простой рендер монет
  function renderCoins(filteredCoins) {
    coinList.innerHTML = "";
    filteredCoins.forEach((coin) => {
      const item = document.createElement("li");
      item.textContent = coin;
      item.classList.add("coin-item");
      item.addEventListener("click", () => fetchSignal(coin));
      coinList.appendChild(item);
    });
  }

  // Поиск монет
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toUpperCase();
    const filtered = coins.filter((coin) => coin.includes(query));
    renderCoins(filtered);
  });

  renderCoins(coins); // initial render

  // Запрос сигнала с backend
  async function fetchSignal(symbol) {
    signalDisplay.innerHTML = "<p>Загрузка сигнала...</p>";

    try {
      const res = await fetch(`https://your-backend-api.com/analyze?symbol=${symbol}`);
      const data = await res.json();

      signalDisplay.innerHTML = `
        <h2>${symbol}</h2>
        <p><strong>Сигнал:</strong> ${data.signal}</p>
        <p><strong>Таймфрейм:</strong> ${data.timeframe}</p>
        <p><strong>Статус:</strong> ${data.status}</p>
        <p><strong>Уверенность:</strong> ${(data.confidence * 100).toFixed(1)}%</p>
        <p><strong>Аргументация:</strong></p>
        <ul>
          ${data.arguments.map(arg => `<li>${arg}</li>`).join("")}
        </ul>
      `;
    } catch (error) {
      console.error("Ошибка загрузки сигнала:", error);
      signalDisplay.innerHTML = "<p style='color:red;'>Ошибка загрузки сигнала</p>";
    }
  }
});
