import React, { useEffect, useRef } from "react";

function App() {
  const localVideoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    .then(stream => {
      localVideoRef.current.srcObject = stream;
    })
    .catch(error => {
      console.error("Error accessing camera:", error);
    });
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Video Conference Room</h2>
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        style={{ width: "500px", border: "2px solid black" }}
      />
    </div>
  );
}

export default App;