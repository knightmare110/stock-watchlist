// src/pages/Watchlist.jsx
import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import axios from 'axios';
import { subscribe } from '../../graphql/subscriptions';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import DashboardLayout from '../../components/DashboardLayout';
import LogHistory from '../../components/LogHistory';

const client = generateClient();

const WatchlistPage = () => {
  const [stockData, setStockData] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [logData, setLogData] = useState([]);
  const [barChartData, setBarChartData] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const userid = localStorage.getItem('userid');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const observable = client.graphql({
      query: subscribe,
      variables: { name: `user_${userid}_channel` },
    }).subscribe({
      next: ({ data }) => {
        if (data?.subscribe) {
          const stockUpdates = JSON.parse(data.subscribe.data);

          const timestamp = new Date().getTime();

          const updatedStockData = { ...stockData };

          Object.entries(stockUpdates).forEach(([stockName, closePrice]) => {
            const newPoint = [
              timestamp,
              closePrice + Math.random() * 20, // Open
              closePrice + Math.random() * 10, // High
              closePrice - Math.random() * 10, // Low
              closePrice - Math.random() * 20, // Close
            ];

            // Update candlestick data for each stock
            if (!updatedStockData[stockName]) {
              updatedStockData[stockName] = [];
            }
            updatedStockData[stockName] = [...updatedStockData[stockName], newPoint];

            // Update bar chart data
            setBarChartData((prevData) => ({
              ...prevData,
              [stockName]: closePrice,
            }));
          });

          setStockData(updatedStockData);

          // Log the updates
          setLogData((prevLogs) => [
            { timestamp: new Date(), update: stockUpdates },
            ...prevLogs,
          ]);
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });

    return () => observable.unsubscribe();
  }, [userid, stockData]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!token) {
        console.error('No token found, please log in first');
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8000/api/watchlist/${userid}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWatchlist(response.data);
        if (response.data.length > 0) {
          setSelectedStock(response.data[0].ticker); // Default to the first stock
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };
    fetchWatchlist();
  }, [userid, token]);

  // Highcharts options for the candlestick chart
  const candlestickOptions = {
    title: {
      text: `Real-Time Stock Prices for ${selectedStock || 'Select a Stock'}`,
    },
    rangeSelector: {
      enabled: true,
      inputEnabled: false,
      buttons: [
        { type: 'minute', count: 10, text: '10m' },
        { type: 'hour', count: 1, text: '1h' },
        { type: 'all', text: 'All' },
      ],
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: 'Price',
      },
    },
    series: [
      {
        type: 'candlestick',
        name: selectedStock,
        data: stockData[selectedStock] || [],
        color: '#FF7F7F',
        upColor: '#90EE90',
        lastPrice: {
          enabled: true,
          label: {
            enabled: true,
            backgroundColor: '#FF7F7F',
          },
        },
        tooltip: {
          valueDecimals: 2,
        },
      },
    ],
  };

  // Highcharts options for the bar chart
  const barChartOptions = {
    chart: {
      type: 'bar',
    },
    title: {
      text: 'Real-Time Stock Prices by Stock Name',
    },
    xAxis: {
      categories: Object.keys(barChartData),
      title: {
        text: 'Stock Name',
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Price',
      },
    },
    series: [
      {
        name: 'Price',
        data: Object.values(barChartData),
        color: '#4285F4',
      },
    ],
  };

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-6">Your Watchlist</h2>
      <div className="flex gap-5">
        {watchlist.length > 0 ? (
          <table className="bg-white shadow-md rounded w-[32rem]">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Ticker</th>
                <th className="py-2 px-4 border-b">Name</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((stock) => (
                <tr key={stock.ticker}>
                  <td className="py-2 px-4 border-b">{stock.ticker}</td>
                  <td className="py-2 px-4 border-b">{stock.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items in your watchlist</p>
        )}
        <LogHistory logs={logData} />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Real-Time Candlestick Chart</h3>
        <select
          className="mb-4 p-2 border rounded"
          value={selectedStock || ''}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          {watchlist.map((stock) => (
            <option key={stock.ticker} value={stock.ticker}>
              {stock.ticker}
            </option>
          ))}
        </select>
        <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={candlestickOptions} />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Real-Time Bar Chart of Stock Prices</h3>
        <HighchartsReact highcharts={Highcharts} options={barChartOptions} />
      </div>
    </DashboardLayout>
  );
};

export default WatchlistPage;
