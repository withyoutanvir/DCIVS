import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ethers } from "ethers";
import datarequestabi from "../Datarequestabi.json";
import identityabi from "../Identityabi.json";
import decryptData from "./Decrypt";
import LoadingSpinner from "./LoadingSpinner";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
} from "@nextui-org/react";
import { useTheme } from "next-themes";
import ProgressBar from "./ProgressBar";

function ApprovedDataPage({ notifySuccess, notifyDanger }) {
  const { theme } = useTheme();
  const shadowClass = theme === "dark" ? "shadow-white" : "shadow-black";
  const buttonStyle =
    theme === "dark" ? "bg-black text-white border-white" : "bg-white text-black border-black";

  const [approvedRequests, setApprovedRequests] = useState([]);
  const [fetchedData, setFetchedData] = useState({});
  const [loading, setLoading] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = useMemo(() => provider.getSigner(), [provider]);

  const contractAddress = import.meta.env.VITE_DATA_REQUEST_CONTRACT;
  const identityContractAddress = import.meta.env.VITE_IDENTITY_CONTRACT;

  const dataRequestContract = useMemo(
    () => new ethers.Contract(contractAddress, datarequestabi, signer),
    [contractAddress, signer]
  );

  const identityContract = useMemo(
    () => new ethers.Contract(identityContractAddress, identityabi, signer),
    [identityContractAddress, signer]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const loggedInRequesterAddress = await signer.getAddress();
        const requestIDs = await dataRequestContract.getRequestsByRequester(loggedInRequesterAddress);

        // Fetch requests in parallel
        const requests = await Promise.all(
          requestIDs.map(async (requestId) => dataRequestContract.requests(requestId))
        );

        setApprovedRequests(requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        notifyDanger(theme, "Failed to load approved requests.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataRequestContract, signer, theme, notifyDanger]);

  const fetchIPFSData = async (ipfsHash) => {
    try {
      const response = await fetch(`https://white-top-shrimp-287.mypinata.cloud/ipfs/${ipfsHash}`);
      if (!response.ok) throw new Error("Failed to fetch data from IPFS");
      return response.json();
    } catch (error) {
      console.error("IPFS Fetch Error:", error);
      throw error;
    }
  };

  const handleFetchData = useCallback(
    async (userAddress, requestId) => {
      setLoading((prev) => ({ ...prev, [requestId]: true }));

      try {
        const response = await identityContract.users(userAddress);
        const ipfsHash = response[3];

        const data = await fetchIPFSData(ipfsHash);
        const decryptedData = await decryptData(JSON.stringify(data));

        setFetchedData((prevData) => ({
          ...prevData,
          [requestId]: { ...decryptedData, address: userAddress },
        }));

        notifySuccess(theme, "Data Fetched Successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        notifyDanger(theme, "Data Fetching Unsuccessful");
      } finally {
        setLoading((prev) => ({ ...prev, [requestId]: false }));
      }
    },
    [identityContract, theme, notifySuccess, notifyDanger]
  );

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="w-full flex flex-col items-center py-10">
            <h4 className="font-bold text-2xl">APPROVED DATA REQUESTS</h4>
          </div>

          <ol>
            {approvedRequests.map(({ id, user, status }) => (
              <li key={id}>
                <div className="flex justify-center items-center pb-10">
                  <Card shadow="lg" className={`min-w-[475px] bg-background text-foreground ${shadowClass}`}>
                    <CardBody className="overflow-visible">
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">Request ID: <span className="font-normal">{id.toString()}</span></h4>
                      </div>
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">User Address: <span className="font-normal">{user}</span></h4>
                      </div>
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">
                          Status:{" "}
                          <span className={`font-normal ${
                            status === 0 ? "text-orange-500" : status === 1 ? "text-green-500" : "text-red-500"
                          }`}>
                            {status === 0 ? "Pending" : status === 1 ? "Approved" : "Rejected"}
                          </span>
                        </h4>
                      </div>
                    </CardBody>
                    {status === 1 && (
                      <CardFooter className="pb-4">
                        <Button size="md" className={buttonStyle} fullWidth onClick={() => handleFetchData(user, id)}>
                          FETCH DATA
                        </Button>
                      </CardFooter>
                    )}
                    {loading[id] && <ProgressBar />}
                  </Card>
                </div>
              </li>
            ))}
          </ol>

          {Object.keys(fetchedData).length > 0 && (
            <div className="w-full flex flex-col items-center py-10">
              <h4 className="font-bold text-2xl">FETCHED DATA</h4>
            </div>
          )}

          <ol>
            {Object.entries(fetchedData).map(([id, data]) => (
              <li key={id}>
                <div className="flex justify-center items-center pb-10">
                  <Card shadow="lg" className={`min-w-[475px] bg-background text-foreground ${shadowClass}`}>
                    <CardBody className="overflow-visible">
                      {["address", "aadharNumber", "name", "phone", "dateOfBirth", "residentAddress"].map((key) =>
                        data[key] ? (
                          <div key={key} className="flex h-5 items-center space-x-4 py-4">
                            <h4 className="font-bold text-medium">
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:{" "}
                              <span className="font-normal">{data[key]}</span>
                            </h4>
                          </div>
                        ) : null
                      )}
                    </CardBody>
                  </Card>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default ApprovedDataPage;
