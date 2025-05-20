import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognitionUI = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  // Load models when the component mounts
  useEffect(() => {
    async function loadModels() {
      // Ensure to replace the '/models' path with the location of the face-api.js models
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setLoading(false);
    }

    loadModels();
    startVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start the webcam video feed
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error('Error accessing webcam', err));
  };

  // Handle face recognition when the button is clicked
  const handleFaceVerification = async () => {
    if (videoRef.current) {
      const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        // Send the face descriptor to the backend for verification
        const faceDescriptor = detections.descriptor;
        verifyFace(faceDescriptor);
      } else {
        alert('No face detected. Please try again.');
      }
    }
  };

  // Verify the face with the backend
  const verifyFace = async (faceDescriptor) => {
    try {
      const response = await fetch('your-backend-url/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceDescriptor }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsVerified(true); // Set verified state if face matches
        alert('Face Verified Successfully!');
      } else {
        setIsVerified(false); // Set unverified state if face doesn't match
        alert('Face Verification Failed');
      }
    } catch (err) {
      console.error('Error verifying face', err);
    }
  };

  return (
    <div className="face-recognition-container">
      <h2>Face Authentication</h2>

      {loading ? (
        <div>Loading face recognition models...</div>
      ) : (
        <div>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="100%"
            height="auto"
            style={{ border: '1px solid #ccc', marginBottom: '20px' }}
          ></video>

          <div className="verification-status">
            {isVerified ? (
              <span style={{ color: 'green' }}>Verified</span>
            ) : (
              <span style={{ color: 'red' }}>Not Verified</span>
            )}
          </div>

          <button onClick={handleFaceVerification} disabled={loading}>
            Verify Face
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceRecognitionUI;
