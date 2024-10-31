import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [top10, setTop10] = useState([]);

  // const [symbol, setSymbol] = useState('BTCUSDT'); // Вы можете изменить символ по умолчанию
  const [totalAskUSDT, setTotalAskUSDT] = useState(null);
  const [totalBidUSDT, setTotalBidUSDT] = useState(null);
  const [error, setError] = useState(null);

  const [orderBookData, setOrderBookData] = useState({});

  const fetchOrderBookTotals = async (symbol) => {
    const url = `https://api.bitget.com/api/v2/spot/market/merge-depth?symbol=${symbol}&precision=scale0&limit=100`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const asks = data.data.asks;
      const bids = data.data.bids;

      const totalAsk = asks.reduce((total, [price, amount]) => {
        return total + parseFloat(price) * parseFloat(amount);
      }, 0);

      const totalBid = bids.reduce((total, [price, amount]) => {
        return total + parseFloat(price) * parseFloat(amount);
      }, 0);

      setOrderBookData((prevData) => ({
        ...prevData,
        [symbol]: { totalAskUSDT: totalAsk, totalBidUSDT: totalBid },
      }));
      setError(null);
    } catch (err) {
      setError('Error fetching order book');
      console.error('Error fetching order book:', err);
    }
  };

  // Функция для загрузки данных
  async function fetchData() {
    try {
      const baseUrl = 'https://api.bitget.com';
      const tickersEndpoint = '/api/spot/v1/market/tickers';
      const orderBookEndpoint =
        '/v1/spot/public/getTickerInfoBySymbolCodeDisplayName?symbolCodeDisplayName=';

      // Получение тикеров
      const response = await axios.get(baseUrl + tickersEndpoint);
      const data = response.data;

      const usdtPairs = data.data.filter((ticker) =>
        ticker.symbol.includes('USDT'),
      );

      // Функция для получения объема стаканов
      const getOrderBookVolumes = async (symbol) => {
        try {
          const response = await axios.get(
            `https://www.bitget.com/v1/spot/public/getTickerInfoBySymbolCodeDisplayName?symbolCodeDisplayName=${symbol}`,
          );
          const orderBookData = response.data;
          console.log(orderBookData[0]);

          console.log(orderBookData[0].askSz, orderBookData[0].bidSz, 'res');

          if (!orderBookData || !orderBookData.bids || !orderBookData.asks) {
            throw new Error('Некорректные данные ордербука');
          }

          // Суммируем объемы заявок на покупку и продажу
          const totalBidVolume = orderBookData[0].bidSz;
          const totalAskVolume = orderBookData[0].askSz;

          return { totalBidVolume, totalAskVolume };
        } catch (error) {
          // console.error(`Ошибка при получении ордербука для ${symbol}:`, error);
          // return { totalBidVolume: 0, totalAskVolume: 0 };
        }
      };

      // getOrderBookVolumes('ASMUSDT');

      async function fetchOrderBookTotals(symble) {
        const url = `https://api.bitget.com/api/v2/spot/market/merge-depth?symbol=${symble}&precision=scale0&limit=100`;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const asks = data.data.asks;
          const bids = data.data.bids;

          const totalAskUSDT = asks.reduce((total, [price, amount]) => {
            return total + parseFloat(price) * parseFloat(amount);
          }, 0);

          const totalBidUSDT = bids.reduce((total, [price, amount]) => {
            return total + parseFloat(price) * parseFloat(amount);
          }, 0);

          // продажа
          console.log(`Total Ask in USDT: ${totalAskUSDT}`);
          // покупка
          console.log(`Total Bid in USDT: ${totalBidUSDT}`);
        } catch (error) {
          console.error('Error fetching order book:', error);
        }
      }

      // Вызов функции
      fetchOrderBookTotals();

      //   (async () => {
      //     const { totalBidUSDT, totalAskUSDT } = await getOrderBook('CATBOYUSDT');
      //     // console.log(`Total Bid in USDT: ${totalBidUSDT}`);
      //     // console.log(`Total Ask in USDT: ${totalAskUSDT}`);
      // })();

      // getOrderBook('CATBOYUSDT')

      // Обработка данных тикеров
      const differences = await Promise.all(
        usdtPairs.map(async (pair) => {
          const buyPrice = parseFloat(pair.buyOne);
          const sellPrice = parseFloat(pair.sellOne);
          const usdtVol = parseFloat(pair.usdtVol);

          if (buyPrice > 0) {
            const percentageDifference =
              ((sellPrice - buyPrice) / buyPrice) * 100;
            // Получаем объемы из ордербука
            // const { totalBidVolume, totalAskVolume } =
            //   await getOrderBookVolumes(pair.symbol);
            // console.log(typeof pair.symbol);

            return {
              symbol: pair.symbol,
              buyPrice,
              sellPrice,
              percentageDifference,
              usdtVol,
              // totalBidVolume,
              // totalAskVolume,
            };
          }
          return null;
        }),
      );

      const filteredDifferences = differences.filter(Boolean);
      filteredDifferences.sort(
        (a, b) => b.percentageDifference - a.percentageDifference,
      );
      setTop10(filteredDifferences.slice(0, 50));
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
                {pair.totalAskVolume !== undefined && (
                  <p>{pair.totalAskVolume}</p>
                )}
                {pair.totalBidVolume !== undefined && (
                  <p>{pair.totalBidVolume}</p>
                )}
                <p>Пара: {pair.symbol}</p>
                {pair.buyPrice !== undefined && <p>Покупка: {pair.buyPrice}</p>}
                {pair.sellPrice !== undefined && (
                  <p>Продажа: {pair.sellPrice}</p>
                )}
                <p>Волатильность: {pair.usdtVol} USDT</p>
                {pair.percentageDifference !== undefined && (
                  <p>Разница: {pair.percentageDifference.toFixed(2)}%</p>
                )}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.bitget.com/ru/spot/${pair.symbol}?type=spot`}
                >
                  Ссылка на спот
                </a>
                <div>
                  <button onClick={() => fetchOrderBookTotals(pair.symbol)}>
                  {orderBookData[pair.symbol]?.totalAskUSDT !== undefined ? 'Обновить' : 'Смотреть стакан'}
                  </button>
                  {error ? (
                    <p>{error}</p>
                  ) : (
                    <div>
                      <p>
                        Продажа в стакане:{' '}
                        {orderBookData[pair.symbol]?.totalAskUSDT !== undefined
                          ? `${orderBookData[pair.symbol].totalAskUSDT.toFixed(
                              2,
                            )} USDT`
                          : 'N/A'}
                      </p>
                      <p>
                        Покупка в стакане:{' '}
                        {orderBookData[pair.symbol]?.totalBidUSDT !== undefined
                          ? `${orderBookData[pair.symbol].totalBidUSDT.toFixed(
                              2,
                            )} USDT`
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
