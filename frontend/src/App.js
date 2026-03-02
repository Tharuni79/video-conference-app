import React, { useRef, useState } from "react";

function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const socketRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const joinRoom = async () => {
    if (!roomId) {
      alert("Please enter room ID");
      return;
    }

    setJoined(true);

    // Start Camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideoRef.current.srcObject = stream;

    // Create Peer Connection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ],
    });

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Connect WebSocket
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/${roomId}`);

    socketRef.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.type === "offer") {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socketRef.current.send(
          JSON.stringify({ type: "answer", answer })
        );
      }

      if (data.type === "answer") {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }

      if (data.type === "ice-candidate") {
        await peerConnection.current.addIceCandidate(data.candidate);
      }
    };
peerConnection.current.onicecandidate = (event) => {
  if (
    event.candidate &&
    socketRef.current &&
    socketRef.current.readyState === WebSocket.OPEN
  ) {
    socketRef.current.send(
      JSON.stringify({
        type: "ice-candidate",
        candidate: event.candidate,
      })
    );
  }
};    // Create Offer
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socketRef.current.onopen = () => {
      socketRef.current.send(
        JSON.stringify({ type: "offer", offer })
      );
    };
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      {!joined && (
        <>
          <h2>Join Video Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: "8px", width: "200px" }}
          />
          <br /><br />
          <button onClick={joinRoom} style={{ padding: "8px 20px" }}>
            Join
          </button>
        </>
      )}

      {joined && (
        <>
          <h2>Room: {roomId}</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "300px", backgroundColor: "black" }}
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "300px", backgroundColor: "black" }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default App;