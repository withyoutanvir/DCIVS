import React, { useState } from "react";
import { Card, CardHeader, CardBody, Button, Input } from "@nextui-org/react";
import { useTheme } from "next-themes";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Important: Set worker source manually (CDN fallback or local path)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function PANVerification() {
  const [pan, setPan] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [panValidity, setPanValidity] = useState("");
  const [file, setFile] = useState(null);
  const { theme } = useTheme();

  const verifyPAN = async () => {
    try {
      const response = await fetch("https://test-api.sandbox.co.in/kyc/pan/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pan: pan,
          name: name,
          date_of_birth: dob
        })
      });

      const data = await response.json();

      if (data.status === "valid") {
        setPanValidity("✅ PAN is valid and matches name and DOB.");
      } else {
        setPanValidity(`❌ PAN invalid: ${data.remarks || "Mismatch or not found"}`);
      }
    } catch (err) {
      console.error("PAN verification error:", err);
      setPanValidity("❌ Error verifying PAN.");
    }
  };

  const handlePDFUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);

      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
      let textContent = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        textContent += strings.join(" ");
      }

      const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
      const dobRegex = /\d{2}\/\d{2}\/\d{4}/;
      const nameRegex = /Name[\s:]*([A-Z ]{3,})/i;

      const foundPan = textContent.match(panRegex);
      const foundDob = textContent.match(dobRegex);
      const foundNameMatch = textContent.match(nameRegex);

      if (foundPan) setPan(foundPan[0]);
      if (foundDob) {
        const [day, month, year] = foundDob[0].split("/");
        setDob(`${year}-${month}-${day}`);
      }
      if (foundNameMatch) setName(foundNameMatch[1].trim());

      setFile(selectedFile);
    };

    fileReader.readAsArrayBuffer(selectedFile);
  };

  return (
    <div className="flex justify-center items-center py-20">
      <Card className="min-w-[500px] p-4">
        <CardHeader className="text-xl font-bold">Verify Your PAN Card</CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Input label="PAN Number" value={pan} onChange={(e) => setPan(e.target.value)} />
          <Input label="Name (as per PAN)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Date of Birth (YYYY-MM-DD)" value={dob} onChange={(e) => setDob(e.target.value)} />

          <div className="flex flex-col gap-2 mt-4">
            <label className="text-sm font-semibold">OR Upload PAN PDF:</label>
            <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
            {file && <p className="text-xs text-green-600">✅ {file.name} selected</p>}
          </div>

          <Button onClick={verifyPAN} color="primary" className="mt-4">
            Verify PAN
          </Button>

          {panValidity && <p className="mt-2 font-semibold">{panValidity}</p>}
        </CardBody>
      </Card>
    </div>
  );
}

export default PANVerification;
