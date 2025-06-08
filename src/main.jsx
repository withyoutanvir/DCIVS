import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { ThirdwebProvider, metamaskWallet, walletConnect } from "@thirdweb-dev/react";

// Create router with future flags enabled
const router = createBrowserRouter(
  [
    {
      path: "/*",
      element: <App />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThirdwebProvider
      clientId={import.meta.env.VITE_TW_CLIENT_ID}
      supportedWallets={[metamaskWallet(), walletConnect()]}
    >
      <RouterProvider router={router} />
    </ThirdwebProvider>
  </React.StrictMode>
);
