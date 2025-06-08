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
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useTheme } from "next-themes";
import ProgressBar from "./ProgressBar";
import jsPDF from "jspdf";

function ApprovedDataPage({ notifySuccess, notifyDanger }) {
  const { theme } = useTheme();
  const shadowClass = theme === "dark" ? "shadow-white" : "shadow-black";
  const buttonStyle = theme === "dark"
    ? "bg-black text-white border-white"
    : "bg-white text-black border-black";

  const [approvedRequests, setApprovedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
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
        const requests = await Promise.all(
          requestIDs.map(async (requestId) => {
            const req = await dataRequestContract.requests(requestId);
            return { ...req, id: requestId };
          })
        );
        setApprovedRequests(requests);
        setFilteredRequests(requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        notifyDanger(theme, "Failed to load approved requests.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataRequestContract, signer, theme, notifyDanger]);

  useEffect(() => {
    const filter = () => {
      if (filterStatus === "all") return setFilteredRequests(approvedRequests);
      const filtered = approvedRequests.filter((r) => r.status.toString() === filterStatus);
      setFilteredRequests(filtered);
    };
    filter();
  }, [filterStatus, approvedRequests]);

  const fetchIPFSData = async (ipfsHash) => {
    const response = await fetch(`https://white-top-shrimp-287.mypinata.cloud/ipfs/${ipfsHash}`);
    if (!response.ok) throw new Error("Failed to fetch from IPFS");
    return response.json();
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    let y = 10;
    Object.entries(data).forEach(([key, val]) => {
      doc.text(`${key}: ${val}`, 10, y);
      y += 10;
    });
    doc.save("user_data.pdf");
  };

  const handleFetchData = useCallback(async (userAddress, requestId) => {
    setLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const user = await identityContract.users(userAddress);
      const ipfsHash = user[3];
      const data = await fetchIPFSData(ipfsHash);
      const decryptedData = await decryptData(JSON.stringify(data));
      setFetchedData((prev) => ({ ...prev, [requestId]: { ...decryptedData, address: userAddress } }));
      notifySuccess(theme, "Data Fetched Successfully");
    } catch (err) {
      console.error("Data fetch error:", err);
      notifyDanger(theme, "Data Fetching Failed");
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  }, [identityContract, theme, notifySuccess, notifyDanger]);

  return (
    <div>
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="w-full flex flex-col items-center py-10">
            <h4 className="font-bold text-2xl">APPROVED DATA REQUESTS</h4>
            <Select
              label="Filter by Status"
              className="max-w-xs py-4"
              onChange={(e) => setFilterStatus(e.target.value)}
              selectedKeys={[filterStatus]}
            >
              <SelectItem key="all" value="all">All</SelectItem>
              <SelectItem key="0" value="0">Pending</SelectItem>
              <SelectItem key="1" value="1">Approved</SelectItem>
              <SelectItem key="2" value="2">Rejected</SelectItem>
            </Select>
          </div>

          <ol>
            {filteredRequests.map(({ id, user, status }) => (
              <li key={id}>
                <div className="flex justify-center items-center pb-10">
                  <Card shadow="lg" className={`min-w-[475px] bg-background text-foreground ${shadowClass}`}>
                    <CardBody>
                      <div className="py-2"><b>Request ID:</b> {id.toString()}</div>
                      <div className="py-2"><b>User Address:</b> {user}</div>
                      <div className="py-2">
                        <b>Status:</b> <span className={
                          status === 0 ? "text-orange-500" :
                          status === 1 ? "text-green-500" : "text-red-500"
                        }>
                          {status === 0 ? "Pending" : status === 1 ? "Approved" : "Rejected"}
                        </span>
                      </div>
                    </CardBody>
                    {status === 1 && (
                      <CardFooter>
                        <Button className={buttonStyle} onClick={() => handleFetchData(user, id)} fullWidth>
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
                    <CardBody>
                      {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="py-2">
                          <b>{key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}:</b> {value}
                        </div>
                      ))}
                    </CardBody>
                    <CardFooter>
                      <Button className={buttonStyle} onClick={() => exportToPDF(data)} fullWidth>
                        Download PDF
                      </Button>
                    </CardFooter>
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