// src/pages/Watchlist.jsx
import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import axios from 'axios';
import { subscribe } from '../../graphql/subscriptions';
// Generate an AppSync client instance
const client = generateClient();

const WatchlistPage = () => {
  const [stockData, setStockData] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const username = localStorage.getItem('username'); // Assumes username is stored in local storage
  const token = localStorage.getItem('token'); // Assumes token is stored in local storage

  useEffect(() => {
    // Subscribe to real-time stock updates
    console.log('t', client, subscribe)
    const observable = client.graphql({
      query: subscribe,
      variables: { name: `user_6_channel` },
    }).subscribe({
      next: ({ data }) => {
        console.log('ttt', data);
        if (data?.subscribe) {
          const stockUpdates = JSON.parse(data.subscribe.data);
          setStockData((prevData) => [...prevData, stockUpdates]);
        }
      },
      error: (error) => console.error('Subscription error:', error),
    });

    // Clean up the subscription on component unmount
    return () => observable.unsubscribe();
  }, [username]);

  // Fetch watchlist data from backend
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!token) {
        console.error('No token found, please log in first');
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8000/api/watchlist/${username}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWatchlist(response.data);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };
    fetchWatchlist();
  }, [username, token]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Your Watchlist</h2>
      {watchlist.length > 0 ? (
        <table className="min-w-full bg-white shadow-md rounded">
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
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Real-Time Stock Updates</h3>
        {stockData.length > 0 ? (
          stockData.map((update, index) => (
            <div key={index} className="mb-2">
              {Object.entries(update).map(([ticker, price]) => (
                <div key={ticker}>
                  <strong>{ticker}</strong>: ${price}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No updates yet</p>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
