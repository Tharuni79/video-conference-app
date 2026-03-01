from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Video Conference Backend Running"}