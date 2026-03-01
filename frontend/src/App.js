import React, { useEffect, useRef } from "react";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const roomId = "room1";

  useEffect(() => {
    const start = async () => {

      socket.current = new WebSocket(`ws://localhost:8000/ws/${roomId}`);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
});

      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = event => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          socket.current.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate
          }));
        }
      };

      socket.current.onmessage = async (message) => {
        const data = JSON.parse(message.data);

        if (data.type === "offer") {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);

          socket.current.send(JSON.stringify({
            type: "answer",
            answer: answer
          }));
        }

        if (data.type === "answer") {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.type === "ice") {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      };

      socket.current.onopen = async () => {
        // Wait 2 seconds before creating offer
        setTimeout(async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          socket.current.send(JSON.stringify({
            type: "offer",
            offer: offer
          }));
        }, 2000);
      };
    };

    start();
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Video Conference Room</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          style={{ width: "400px", border: "2px solid black" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "400px", border: "2px solid black" }}
        />
      </div>
    </div>
  );
}

export default App;