import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allStockData, setAllStockData] = useState({});
  const [filteredStockData, setFilteredStockData] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // Function to check user authentication from API
  const checkAuth = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/auth/check/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      
      if (response.status !== 200) {
        navigate("/login"); // Redirect to login if not authenticated
      }
    } catch (error) {
      console.error("User not authenticated:", error);
      navigate("/login"); // Redirect to login on error
    }
  };

  // Fetch stock data if authenticated
  const fetchStockData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/stocks/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setAllStockData(response.data);
      setFilteredStockData(Object.entries(response.data));
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  // On component mount, check authentication, then fetch stock data
  useEffect(() => {
    checkAuth().then(() => fetchStockData());
  }, []);

  // Update filtered data when search query changes
  useEffect(() => {
    const filteredData = Object.entries(allStockData).filter(([ticker, name]) =>
      ticker.includes(searchQuery.toUpperCase()) ||
      name.toUpperCase().includes(searchQuery.toUpperCase())
    );
    setFilteredStockData(filteredData);
  }, [searchQuery, allStockData]);

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-6">Stock Search</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search for stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded mr-2"
        />
      </div>
      <table className="min-w-full bg-white shadow-md rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Ticker</th>
            <th className="py-2 px-4 border-b">Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredStockData.length > 0 ? (
            filteredStockData.map(([ticker, name]) => (
              <tr key={ticker}>
                <td className="py-2 px-4 border-b">{ticker}</td>
                <td className="py-2 px-4 border-b">{name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="py-4 text-center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default DashboardPage;
