// src/pages/Watchlist.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const username = localStorage.getItem("username"); // Assumes username is stored in local storage
  const token = localStorage.getItem("token"); // Assumes token is stored in local storage

  // Fetch watchlist data
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        if (!token) {
          console.error("No token found, please login first");
          return;
        }

        const response = await axios.get(`http://localhost:8000/api/watchlist/${username}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setWatchlist(response.data);
      } catch (error) {
        console.error("Error fetching watchlist:", error);
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
    </div>
  );
};

export default WatchlistPage;
