import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [top10, setTop10] = useState([]);

  // Функция для загрузки данных
  async function fetchData() {
    try {
      const baseUrl = 'https://api.bitget.com';
      const endpoint = '/api/spot/v1/market/tickers';
      const response = await axios.get(baseUrl + endpoint);
      const data = response.data;

      const usdtPairs = data.data.filter((ticker) =>
        ticker.symbol.includes('USDT'),
      );

      const differences = usdtPairs
        .map((pair) => {
          const buyPrice = parseFloat(pair.buyOne);
          const sellPrice = parseFloat(pair.sellOne);
          const usdtVol = parseFloat(pair.usdtVol);

          if (buyPrice > 0) {
            const percentageDifference =
              ((sellPrice - buyPrice) / buyPrice) * 100;
            return {
              symbol: pair.symbol,
              buyPrice,
              sellPrice,
              percentageDifference,
              usdtVol,
            };
          }
          return null;
        })
        .filter(Boolean);

      differences.sort(
        (a, b) => b.percentageDifference - a.percentageDifference,
      );

      setTop10(differences.slice(0, 50));
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  }

  // Используем useEffect для первоначальной загрузки данных
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Топ-50 USDT Торговых Пар</h1>
        <button onClick={fetchData}>Обновить список</button>
        <ul>
          {top10
            .sort((a, b) => b.usdtVol - a.usdtVol)
            .map((pair) => (
              <li key={pair.symbol}>
                <p>Пара: {pair.symbol}</p>
                <p>Покупка: {pair.buyPrice}</p>
                <p>Продажа: {pair.sellPrice}</p>
                <p>Волатильность: {pair.usdtVol} USDT</p>
                <p>Разница: {pair.percentageDifference.toFixed(2)}%</p>
                <a target='_blank' href={`https://www.bitget.com/ru/spot/${pair.symbol}?type=spot`}>Ссылка на спот</a>
              </li>
            ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
