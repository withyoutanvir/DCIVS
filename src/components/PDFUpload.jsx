import React, { useState } from "react";
import { Button, Card, CardHeader, CardBody, Progress } from "@nextui-org/react";

const FingerprintAuth = ({ setUserData, jsonObject }) => {
  const [authStatus, setAuthStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Convert base64url to Uint8Array
  const base64urlToUint8Array = (base64url) => {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
  };

  // Function to start fingerprint authentication
  const authenticateUser = async () => {
    if (!window.PublicKeyCredential) {
      setAuthStatus("Fingerprint authentication is not supported in this browser.");
      return;
    }

    setLoading(true);
    setAuthStatus("");

    try {
      // Fetch challenge & credential ID from backend
      const serverResponse = await fetch("https://your-api.com/get-challenge");
      const { challenge, credentialId } = await serverResponse.json();

      const publicKeyCredentialRequestOptions = {
        challenge: base64urlToUint8Array(challenge), // Convert challenge to Uint8Array
        allowCredentials: [
          {
            type: "public-key",
            id: base64urlToUint8Array(credentialId), // Convert credential ID
            transports: ["internal"], // Use biometric authentication
          },
        ],
        userVerification: "required",
      };

      // Request credentials from the user
      const credential = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });

      // Send credential to backend for verification
      const response = await fetch("https://your-api.com/verify-fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();
      if (data.success) {
        setUserData(data.userData);
        jsonObject(true);
        setAuthStatus("Authentication successful!");
      } else {
        setAuthStatus("Authentication failed. Try again.");
      }
    } catch (error) {
      console.error("Error during authentication", error);
      setAuthStatus("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <Card shadow="lg" className="min-w-[475px] bg-background text-foreground py-3">
        <CardHeader className="flex-col items-center">
          <h2 className="font-bold text-large">Fingerprint Authentication</h2>
          <p>Use your fingerprint to verify your identity.</p>
        </CardHeader>
        <CardBody className="flex flex-col items-center">
          <Button color="primary" onClick={authenticateUser} disabled={loading}>
            Authenticate with Fingerprint
          </Button>
          {loading && <Progress size="sm" isIndeterminate color="secondary" className="max-w-md mt-2" />}
          <p className="mt-2">{authStatus}</p>
        </CardBody>
      </Card>
    </div>
  );
};

export default FingerprintAuth;
