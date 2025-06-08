import React, { useState, useEffect } from "react";
import "./Homepage.css";

const Homepage = () => {
  const [title, setTitle] = useState("WELCOME TO D.I.V.S");

  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let interval = null;

    const updateTitle = () => {
      let iteration = 0;
      clearInterval(interval);

      interval = setInterval(() => {
        setTitle((currentTitle) =>
          currentTitle
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return "WELCOME TO D.I.V.S"[index];
              }
              return letters[Math.floor(Math.random() * 26)];
            })
            .join("")
        );

        if (iteration >= "WELCOME TO D.I.V.S".length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    const h1Element = document.querySelector(".homepageH1");
    if (h1Element) {
      h1Element.addEventListener("mouseover", updateTitle);
    }

    return () => {
      clearInterval(interval);
      if (h1Element) {
        h1Element.removeEventListener("mouseover", updateTitle);
      }
    };
  }, []);

  return (
    <div className="homepage-container">
      <div className="animated-blobs">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>
      <h1 className="homepageH1">{title}</h1>
    </div>
  );
};

export default Homepage;
