from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# Store active connections by room
connections = {}

@app.get("/")
def home():
    return {"message": "Video Conference Backend Running"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if room_id not in connections:
        connections[room_id] = []

    connections[room_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            # Send message to other users in same room
            for connection in connections[room_id]:
                if connection != websocket:
                    await connection.send_text(data)

    except WebSocketDisconnect:
        connections[room_id].remove(websocket)