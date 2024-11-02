import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [top10, setTop10] = useState([]);
  const [error, setError] = useState(null);

  const [orderBookData, setOrderBookData] = useState({});

  const [purchases, setPurchases] = useState([]);

  const fetchByOrders = async (symbol) => {
    try {
      const url = `https://api.bitget.com/api/v2/spot/market/fills?symbol=${symbol}&limit=10`;
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  };

  const showPurchases = async (symbol) => {
    const orders = await fetchByOrders(symbol);

    // Подсчет количества покупок и продаж
    const buyCount = orders.filter((order) => order.side === 'buy').length;
    const sellCount = orders.filter((order) => order.side === 'sell').length;

    setPurchases((prevPurchases) => ({
      ...prevPurchases,
      [symbol]: {
        orders: orders,
        buyCount: buyCount,
        sellCount: sellCount,
      },
    }));
  };

  const fetchOrderBookTotals = async (symbol, limit = 100) => {
    const url = `https://api.bitget.com/api/v2/spot/market/merge-depth?symbol=${symbol}&precision=scale0&limit=${limit}`;

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
      // setError('Error fetching order book');
      // console.error('Error fetching order book:', err);
    }
  };

  // Функция для загрузки данных
  async function fetchData() {
    try {
      const baseUrl = 'https://api.bitget.com';
      const tickersEndpoint = '/api/spot/v1/market/tickers';

      // Получение тикеров
      const response = await axios.get(baseUrl + tickersEndpoint);
      const data = response.data;

      const usdtPairs = data.data.filter((ticker) =>
        ticker.symbol.includes('USDT'),
      );

      // Обработка данных тикеров
      const differences = await Promise.all(
        usdtPairs.map(async (pair) => {
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
        }),
      );

      const filteredDifferences = differences.filter(Boolean);
      // если добавить эту сортировку, то получаем ска монету с большой разницей в курсе покупки и продажи
      filteredDifferences.sort(
        (a, b) => b.percentageDifference - a.percentageDifference,
      );
      setTop10(filteredDifferences.slice(0, 100));
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  }

  // Используем useEffect для первоначальной загрузки данных
  useEffect(() => {
    fetchData(); // первоначальный вызов
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000); // обновление каждые 10 секунд
    return () => clearInterval(intervalId); // очистка интервала при размонтировании компонента
  }, []);

  useEffect(() => {
    if (top10.length > 0) {
      top10.forEach((pair) => {
        fetchOrderBookTotals(pair.symbol, 100);
      });
    }
  }, [top10]);

  // useEffect(() => {
  //   // Fetch order book totals when the component mounts or when the symbol changes
  //   fetchOrderBookTotals(symbol, 100);
  // }, [symbol]); // Dependency array includes 'symbol' to refetch if it changes

  return (
    <div className="App">
      <header className="App-header">
        <h1>Топ-50 USDT Торговых Пар</h1>
        <button onClick={fetchData}>Обновить список</button>
        <ul>
          {top10
            .sort((a, b) => b.usdtVol - a.usdtVol)
            .map((pair) => (
              <li key={pair.symbol} className="li6ka">
                {pair.totalAskVolume !== undefined && (
                  <div>{pair.totalAskVolume}</div>
                )}
                {pair.totalBidVolume !== undefined && (
                  <div>{pair.totalBidVolume}</div>
                )}
                <div>Пара: {pair.symbol}</div>
                {pair.buyPrice !== undefined && (
                  <div>Покупка: {pair.buyPrice}</div>
                )}
                {pair.sellPrice !== undefined && (
                  <div>Продажа: {pair.sellPrice}</div>
                )}
                <div>Волатильность: {pair.usdtVol} USDT</div>
                {pair.percentageDifference !== undefined && (
                  <div>Разница: {pair.percentageDifference.toFixed(2)}%</div>
                )}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.bitget.com/ru/spot/${pair.symbol}?type=spot`}
                >
                  Ссылка на спот
                </a>
                <div>
                  <button onClick={() => fetchOrderBookTotals(pair.symbol, 15)}>
                    {orderBookData[pair.symbol]?.totalAskUSDT !== undefined
                      ? 'Обновить маленький стакан'
                      : 'Ликвидность супер маленького стакана'}
                  </button>
                  <button onClick={() => fetchOrderBookTotals(pair.symbol, 50)}>
                    {orderBookData[pair.symbol]?.totalAskUSDT !== undefined
                      ? 'Обновить средний стакан'
                      : 'Ликвидность маленького стакана'}
                  </button>
                  <button
                    onClick={() => fetchOrderBookTotals(pair.symbol, 100)}
                  >
                    {orderBookData[pair.symbol]?.totalAskUSDT !== undefined
                      ? 'Обновить большой стакан'
                      : 'Ликвидность большого стакана'}
                  </button>
                  {error ? (
                    <div>{error}</div>
                  ) : (
                    <div
                      className={
                        orderBookData[pair.symbol]?.totalBidUSDT >
                        orderBookData[pair.symbol]?.totalAskUSDT
                          ? 'background-green'
                          : 'background-red'
                      }
                    >
                      <div>
                        Продажа в стакане:{' '}
                        {orderBookData[pair.symbol]?.totalAskUSDT !== undefined
                          ? `${orderBookData[pair.symbol].totalAskUSDT.toFixed(
                              2,
                            )} USDT`
                          : 'N/A'}
                      </div>
                      <div>
                        Покупка в стакане:{' '}
                        {orderBookData[pair.symbol]?.totalBidUSDT !== undefined
                          ? `${orderBookData[pair.symbol].totalBidUSDT.toFixed(
                              2,
                            )} USDT`
                          : 'N/A'}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => showPurchases(pair.symbol)}>
                  Показать покупки
                </button>
                <div>Список покупок</div>
                <ul>
                  <div>
                    Количество покупок: {purchases[pair.symbol]?.buyCount || 0}
                  </div>
                  <div>
                    Количество продаж: {purchases[pair.symbol]?.sellCount || 0}
                  </div>
                  {(purchases[pair.symbol]?.orders || []).map(
                    (purchase, index) => (
                      <li key={index}>
                        <div>
                          Сумма в USDT:{' '}
                          {(
                            parseFloat(purchase.size) *
                            parseFloat(purchase.price)
                          ).toFixed(2)}
                        </div>{' '}
                        <div>Количество: {purchase.size}</div>
                        <div>
                          {purchase.side === 'buy' ? 'покупка' : 'продажа'}
                        </div>
                        <div>
                          Время:{' '}
                          {new Date(parseInt(purchase.ts)).toLocaleString()}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </li>
            ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
