import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { useTheme } from "next-themes";
import { Progress } from "@nextui-org/react";

function PANUpload(props) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const { theme } = useTheme();
  const shadowClass = theme === "dark" ? "shadow-white" : "shadow-black";
  const fileInputRef = useRef(null);

  const onFileChange = event => {
    setFile(event.target.files[0]);
    setUploadStatus('');
    setUploading(false);
    setExtractedData(null);
  };

  const onFileUpload = () => {
    if (!file) {
      setUploadStatus('Please select a PAN PDF file first.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    axios.post('https://your-backend-api.com/upload-pan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      // Assume response.data has extracted PAN info
      const panInfo = response.data;
      setExtractedData(panInfo);
      setUploadStatus('PAN uploaded and data extracted successfully!');
      setUploading(false);
      props.setUserData(panInfo); // pass extracted data upstream if needed
      props.jsonObject(true);
    })
    .catch(error => {
      console.error('Error uploading PAN file', error);
      setUploadStatus(`Error uploading PAN file: ${error.message}`);
      setUploading(false);
    });
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex justify-center items-center py-20">
      <Card
        shadow="lg"
        className={`min-w-[475px] ${theme === "dark" ? "light" : "dark"} bg-background text-foreground ${shadowClass} py-3`}
      >
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
          <div className="flex flex-col items-center mb-5">
            <h2 className="font-bold text-large">UPLOAD YOUR PAN CARD PDF</h2>
            <h5 className="font-bold text-large">
              Please upload your PAN card PDF downloaded from NSDL or your provider.
            </h5>
          </div>
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          <div className="flex items-center justify-center w-full">
            <Button color="success" auto onClick={handleClick}>
              Choose PAN PDF
            </Button>
            {file && <span className="ml-2">{file.name}</span>}
          </div>
        </CardHeader>
        <CardBody className="flex flex-col items-center">
          {file && (uploading ? (
            <Progress
              size="sm"
              isIndeterminate
              color="secondary"
              aria-label="Loading..."
              className="max-w-md"
            />
          ) : (
            <Button onClick={onFileUpload} color="secondary" disabled={uploading} auto style={{ width: '50%' }}>
              Upload PAN
            </Button>
          ))}
          <p>{uploadStatus}</p>
          {extractedData && (
            <div className="mt-4 text-left">
              <p><strong>PAN Number:</strong> {extractedData.panNumber}</p>
              <p><strong>Name:</strong> {extractedData.name}</p>
              <p><strong>Date of Birth:</strong> {extractedData.dateOfBirth}</p>
              {/* Add more fields if your backend provides */}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default PANUpload;
