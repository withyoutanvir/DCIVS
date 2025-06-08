import { useState, useEffect, useRef } from "react";
import Register from "./components/Register";
import Encrypt from "./components/Encrypt";
import { useAddress } from "@thirdweb-dev/react";
import { Routes, Route, useNavigate } from "react-router-dom";
import SelectModal from "./components/SelectModal";
import UserData from "./components/UserData";
import UserDashboard from "./components/UserDashboard";
import ApprovedDataPage from "./components/ApprovedDataPage";
import { useLocation } from "react-router-dom";
import Navbar2 from "./components/Navbar";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import RequesterCardUI from "./components/RequesterCardUI";
import Homepage from "./components/Homepage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "next-themes";
import { Slide } from "react-toastify";
import UserPage from "./components/UserPage";
import LoadingSpinner from "./components/LoadingSpinner";
// Removed PDFUpload import
import PANUpload from "./components/PANUpload";

let toastId;
const notifyInfo = (theme) =>
  toast.info("Connect To Polygon Amoy", {
    position: "bottom-center",
    autoClose: 5000,
    theme: theme === "dark" ? "light" : "dark",
  });

const notifyWarnTestNet = (theme) => {
  toastId.current = toast.warn("Connect To Polygon Mumbai", {
    position: "bottom-center",
    autoClose: false,
    closeOnClick: false,
    closeButton: false,
    theme: theme === "dark" ? "light" : "dark",
  });
};

const notifyTestNetSuccess = (theme) => {
  toast.update(toastId.current, {
    render: "Successfully Connected To Polygon Mumbai",
    type: "success",
    autoClose: 2000,
    closeButton: true,
    theme: theme === "dark" ? "light" : "dark",
  });
};

const notifyWarn = (theme, content) => {
  toast.warn(content, {
    position: "bottom-center",
    autoClose: 5000,
    theme: theme === "dark" ? "light" : "dark",
  });
};

const notifySuccess = (theme, content) => {
  toast.success(content, {
    position: "bottom-center",
    autoClose: 2000,
    theme: theme === "dark" ? "light" : "dark",
  });
};

const notifyDanger = (theme, content) => {
  toast.error(content, {
    position: "bottom-center",
    autoClose: 2000,
    theme: theme === "dark" ? "light" : "dark",
  });
};

function Navigation() {
  const address = useAddress();
  const navigate = useNavigate();

  useEffect(() => {
    address ? navigate("/menu") : navigate("/");
  }, [address]);

  return null;
}

function RouterHandler({ setRequester, networkId }) {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    if (location.pathname === "/") return;
    else if (location.pathname === "/requester") {
      setRequester(true);
    } else if (networkId && networkId !== "80002") {
      notifyWarnTestNet(theme);
    } else if (networkId === "80002") {
      notifyTestNetSuccess(theme);
    }
  }, [setRequester, networkId]);

  return null;
}

function App() {
  const navigate = useNavigate();
  const [register, setRegister] = useState(true);
  const [accountAddress, setAccountAddress] = useState("");
  const [showIdentity, setIdentity] = useState(false);
  const [userSelect, setUserSelect] = useState(false);
  const [requester, setRequester] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [fetchedDetails, setFetchedDetails] = useState(null);
  const [userAlert, setUserAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const { theme } = useTheme();
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(null);
  const [jsonObject, setJsonObject] = useState(false);
  const [userData, setUserData] = useState("");
  const address = useAddress();

  useEffect(() => {
    if (address) console.log("Wallet connected:", address);
  }, [address]);

  useEffect(() => {
    const checkMetaMaskInstalled = () => typeof window.ethereum !== "undefined";
    setIsMetaMaskInstalled(checkMetaMaskInstalled());
  }, []);

  useEffect(() => {
    if (address !== undefined) {
      setAccountAddress(address);
      setIdentity(false);
      setRegister(false);
      setJsonObject(false);
    } else {
      setRegister(true);
    }
  }, [address]);

  useEffect(() => {
    let isMounted = true;
    const fetchUserDetails = async () => {
      if (!isMounted) return;
      setLoading(true);
      setJsonObject(false);
      setFetchedDetails(null);

      try {
        const details = await UserData();
        if (!isMounted) return;
        if (details) {
          setUserExists(true);
          setFetchedDetails(details);
          setUserAlert("exists");
        } else {
          setUserExists(false);
          setUserAlert("notRegistered");
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        if (!isMounted) return;
        setUserExists(false);
        setUserAlert("error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userSelect || requester) {
      fetchUserDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [userSelect, accountAddress, requester, networkId]);

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (newChainId) => {
        const networkId = parseInt(newChainId, 16).toString();
        setNetworkId(networkId);
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      window.ethereum
        .request({ method: "net_version" })
        .then((currentNetworkId) => setNetworkId(currentNetworkId))
        .catch((error) => console.error("Error fetching network ID:", error));

      return () =>
        window.ethereum.removeListener("chainChanged", handleChainChanged);
    } else {
      setIsMetaMaskInstalled(false);
    }
  }, []);

  toastId = useRef(null);

  return (
    <div className="animated-bg">
      <NextUIProvider navigate={navigate}>
        <NextThemesProvider
          defaultTheme="dark"
          themes={["light", "dark"]}
          attribute="class"
        >
          <Navbar2
            setRegister={setRegister}
            register={register}
            setIdentity={setIdentity}
            address={address}
            checkMetmask={isMetaMaskInstalled}
          />
          <ToastContainer
            position="bottom-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnFocusLoss
            transition={Slide}
            draggable
            pauseOnHover
            theme={theme === "dark" ? "light" : "dark"}
          />
          <Navigation />
          <RouterHandler setRequester={setRequester} networkId={networkId} />

          <Routes>
            <Route
              exact
              path="/"
              element={
                isMetaMaskInstalled ? (
                  <Homepage notify={notifyInfo} />
                ) : (
                  <div className="flex centered">
                    <h1 className="font-bold text-4xl">
                      Metamask Is Not Installed
                    </h1>
                  </div>
                )
              }
            />
            <Route
              exact
              path="/register"
              element={<Register showIdentity={showIdentity} />}
            />
            <Route
              path="/menu"
              element={
                address ? (
                  <SelectModal
                    setUser={setUserSelect}
                    setRequester={setRequester}
                  />
                ) : (
                  <div>Connect wallet to continue</div>
                )
              }
            />
            <Route
              exact
              path="/user"
              element={
                <>
                  {loading ? (
                    <LoadingSpinner />
                  ) : userSelect && fetchedDetails ? (
                    <UserPage
                      address={address}
                      userId={fetchedDetails[0].toString()}
                      IpfsHash={fetchedDetails[2]}
                    />
                  ) : (
                    <>
                      <PANUpload
                        accountAddress={address}
                        setAccountAddress={setAccountAddress}
                        jsonObject={setJsonObject}
                        setUserData={setUserData}
                      />
                      {jsonObject && (
                        <Encrypt
                          accountAddress={address}
                          setAccountAddress={setAccountAddress}
                          userData={userData}
                        />
                      )}
                    </>
                  )}
                </>
              }
            />
            <Route
              exact
              path="/requester"
              element={
                <>
                  {loading ? (
                    <LoadingSpinner />
                  ) : requester && fetchedDetails ? (
                    <RequesterCardUI
                      notifyWarn={notifyWarn}
                      notifyDanger={notifyDanger}
                      notifySuccess={notifySuccess}
                      signerAddress={address}
                    />
                  ) : (
                    <>
                      <PANUpload
                        accountAddress={address}
                        setAccountAddress={setAccountAddress}
                        jsonObject={setJsonObject}
                        setUserData={setUserData}
                      />
                      {jsonObject && (
                        <Encrypt
                          accountAddress={address}
                          setAccountAddress={setAccountAddress}
                          userData={userData}
                        />
                      )}
                    </>
                  )}
                </>
              }
            />
            <Route
              exact
              path="/dashboard"
              element={
                <UserDashboard
                  notifyWarn={notifyWarn}
                  notifyDanger={notifyDanger}
                  notifySuccess={notifySuccess}
                />
              }
            />
            <Route
              exact
              path="/approved-data"
              element={
                <ApprovedDataPage
                  notifyWarn={notifyWarn}
                  notifyDanger={notifyDanger}
                  notifySuccess={notifySuccess}
                />
              }
            />
          </Routes>
        </NextThemesProvider>
      </NextUIProvider>
    </div>
  );
}

export default App;
