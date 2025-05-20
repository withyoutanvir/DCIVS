import FormData from "form-data";
import axios from "axios";

const IPFSutils = async (content, fileType = "text/plain", fileName = "file.txt") => {
  const JWT = process.env.PINATA_JWT; // Store JWT securely in environment variables

  if (!JWT) {
    throw new Error("Authentication token (JWT) is missing. Set PINATA_JWT in env.");
  }

  try {
    // Convert content to Blob/File based on the provided type
    const file =
      fileType === "application/json"
        ? new Blob([JSON.stringify(content)], { type: fileType }) // Convert JSON to Blob
        : new Blob([content], { type: fileType }); // Default: Text or other formats

    const data = new FormData();
    data.append("file", file, fileName); // Attach file with a dynamic name

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        headers: { Authorization: JWT },
      }
    );

    return response.data; // Returns IPFS Hash and other details
  } catch (error) {
    console.error("IPFS Upload Error:", error.response?.data || error.message);
    throw new Error("Failed to upload file to IPFS.");
  }
};

export default IPFSutils;
