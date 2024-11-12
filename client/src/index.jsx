import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Amplify } from 'aws-amplify';
import awsconfig from './utils/aws-exports'; // Ensure this path matches your setup
import "./index.css";

Amplify.configure(awsconfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
