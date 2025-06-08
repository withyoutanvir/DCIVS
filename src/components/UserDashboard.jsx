import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ethers } from "ethers";
import datarequestabi from "../Datarequestabi.json";
import FetchIPFSData from "./FetchIPFSData";
import IPFSutils from "./IPFSutils";
import identityabi from "../Identityabi.json";
import { encrypt } from "@metamask/eth-sig-util";
import LoadingSpinner from "./LoadingSpinner";
import { Card, CardFooter, CardBody, Button } from "@nextui-org/react";
import { Divider } from "@nextui-org/react";
import { useTheme } from "next-themes";
import ProgressBar from "./ProgressBar";

function UserDashboard(props) {
  const [userRequests, setUserRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState({});
  const [noOfTransaction, setNoOfTransaction] = useState(0);
  const { theme } = useTheme();
  const shadowClass = theme === "dark" ? "shadow-white" : "shadow-black";
  const buttonStyle =
    theme === "dark"
      ? "bg-black text-white border-white"
      : "bg-white text-black border-black";

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contractAddress = import.meta.env.VITE_DATA_REQUEST_CONTRACT;
  const identityContractAddress = import.meta.env.VITE_IDENTITY_CONTRACT;

  const identityContract = new ethers.Contract(
    identityContractAddress,
    identityabi,
    signer
  );
  const dataRequestContract = new ethers.Contract(
    contractAddress,
    datarequestabi,
    signer
  );

  const RequestStatus = ["Pending", "Approved", "Rejected"];

  useEffect(() => {
  async function fetchRequests() {
    try {
      setIsLoading(true);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];
      console.log("User Address:", userAddress);

      const requests = await dataRequestContract.getDetailedUserRequests(userAddress);
      console.log("Raw Requests from Contract:", requests);

      const formattedRequests = requests.map((req) => ({
        request: req,
        status: RequestStatus[req.status],
      }));

      console.log("Formatted Requests:", formattedRequests);

      setUserRequests(formattedRequests);
    } catch (err) {
      console.error("Error fetching user requests:", err);
      props.notifyDanger(theme, "Error fetching requests.");
    } finally {
      setIsLoading(false);
    }
  }

  fetchRequests();
}, []);

  async function handleApprove(request) {
    try {
      setLoading((prev) => ({ ...prev, [request.id]: true }));
      setNoOfTransaction(3);

      const address = await signer.getAddress();
      const ipfsHash = await identityContract.getUserIPFSHash();
      const encryptedData = await FetchIPFSData(ipfsHash);

      const response = await identityContract.getUser(request.requester);
      const requesterPublicKey = response[3];

      const decryptedData = await window.ethereum.request({
        method: "eth_decrypt",
        params: [encryptedData, address],
      });

      const decryptedObject = JSON.parse(decryptedData);

      const encryptedForRequester = await encryptJsonObject(
        requesterPublicKey,
        decryptedObject,
        request.fields
      );

      const encryptedIpfsHash = await IPFSutils(encryptedForRequester);
      const tx = await identityContract.setRequesterIpfsHash(
        encryptedIpfsHash.IpfsHash
      );
      await tx.wait();

      setNoOfTransaction(1);

      const dataRequestTx = await dataRequestContract.approveRequest(request.id);
      await dataRequestTx.wait();

      setUserRequests((prev) =>
        prev.map((req) =>
          req.request.id === request.id ? { ...req, status: "Approved" } : req
        )
      );

      props.notifySuccess(theme, "Request Approved");
    } catch (err) {
      console.error("Error approving request:", err);
      props.notifyDanger(theme, "Approval failed.");
    } finally {
      setLoading((prev) => ({ ...prev, [request.id]: false }));
    }
  }

  async function handleReject(requestId) {
    try {
      setLoading((prev) => ({ ...prev, [requestId]: true }));

      const tx = await dataRequestContract.rejectRequest(requestId);
      await tx.wait();

      setUserRequests((prev) =>
        prev.map((req) =>
          req.request.id === requestId ? { ...req, status: "Rejected" } : req
        )
      );

      props.notifySuccess(theme, "Request Rejected");
    } catch (err) {
      console.error("Error rejecting request:", err);
      props.notifyDanger(theme, "Rejection failed.");
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "Pending":
        return "text-orange-500";
      case "Approved":
        return "text-green-500";
      case "Rejected":
        return "text-red-500";
      default:
        return "";
    }
  }

  async function encryptJsonObject(publicKey, jsonObject, fields) {
    const filteredObject = {};
    fields.forEach((field) => {
      if (jsonObject.hasOwnProperty(field)) {
        filteredObject[field] = jsonObject[field];
      }
    });

    const stringifiedObject = JSON.stringify(filteredObject);

    return JSON.stringify(
      encrypt({
        publicKey,
        data: stringifiedObject,
        version: "x25519-xsalsa20-poly1305",
      })
    );
  }

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full flex flex-col items-center py-10">
          <h4 className="font-bold text-2xl">DASHBOARD</h4>

          {userRequests.length === 0 ? (
            <p className="text-center mt-6">No data requests available.</p>
          ) : (
            <ol>
              {userRequests.map(({ request, status }) => (
                <div
                  key={request.id}
                  className="flex justify-center items-center pb-10"
                >
                  <Card
                    shadow="lg"
                    className={`min-w-[475px] ${
                      theme === "dark" ? "light" : "dark"
                    } bg-background text-foreground ${shadowClass}`}
                  >
                    <CardBody className="overflow-visible">
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">
                          Requester:{" "}
                          <span className="font-normal">{request.requester}</span>
                        </h4>
                      </div>
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">
                          Fields:{" "}
                          <span className="font-normal">
                            {request.fields.join(", ")}
                          </span>
                        </h4>
                      </div>
                      <div className="flex h-5 items-center space-x-4 py-4">
                        <h4 className="font-bold text-medium">
                          Status:{" "}
                          <span className={`font-normal ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </h4>
                      </div>
                    </CardBody>
                    <CardFooter className="pb-4">
                      {status === "Pending" && (
                        <div className="w-full flex h-5 items-center space-x-4">
                          <Button
                            size="md"
                            className={buttonStyle}
                            fullWidth
                            onClick={() => handleApprove(request)}
                          >
                            Approve
                          </Button>
                          <Divider orientation="vertical" />
                          <Button
                            size="md"
                            className={buttonStyle}
                            fullWidth
                            onClick={() => handleReject(request.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                    {loading[request.id] && <ProgressBar />}
                  </Card>
                </div>
              ))}
            </ol>
          )}
        </div>
      )}
    </>
  );
}

UserDashboard.propTypes = {
  notifySuccess: PropTypes.func.isRequired,
  notifyDanger: PropTypes.func.isRequired,
};

export default UserDashboard;
