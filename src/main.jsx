import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {
  ThirdwebProvider,
  metamaskWallet,
  walletConnect
} from "@thirdweb-dev/react";
import "./index.css";
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThirdwebProvider
      clientId={import.meta.env.VITE_TW_CLIENT_ID} // Fix the env variable
      supportedWallets={[metamaskWallet(), walletConnect()]}
    >
      <App />
    </ThirdwebProvider>
  </BrowserRouter>
);

