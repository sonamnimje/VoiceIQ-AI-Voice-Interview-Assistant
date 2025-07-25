from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from db_utils import init_db, add_user, save_dashboard_stats
import sqlite3

app = FastAPI()
from db_utils import init_db
init_db()

@app.post("/save_dashboard_stats")
async def api_save_dashboard_stats(request: Request):
    data = await request.json()
    name = data.get("name")
    email = data.get("email")
    interviews_completed = data.get("interviewsCompleted")
    avg_feedback_score = data.get("avgFeedbackScore")
    last_interview_date = data.get("lastInterviewDate")
    if not name or not email:
        return JSONResponse({"success": False, "error": "Missing name or email"}, status_code=400)
    try:
        save_dashboard_stats(name, email, interviews_completed, avg_feedback_score, last_interview_date)
        return {"success": True}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/add_user")
async def api_add_user(request: Request):
    data = await request.json()
    required_fields = ["name", "username", "gmail", "email", "password"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return JSONResponse({"error": f"Missing fields: {', '.join(missing)}"}, status_code=400)
    try:
        add_user(
            name=data.get("name"),
            username=data.get("username"),
            gmail=data.get("gmail"),
            email=data.get("email"),
            password=data.get("password"),
            phone=data.get("phone"),
            address=data.get("address")
        )
        return {"message": "User added successfully"}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/signup")
def signup(user: dict):
    try:
        add_user(
            name=user["name"],
            username=user["username"],
            gmail=user["gmail"],
            email=user["email"],
            password=user["password"],
            phone=user.get("phone"),
            address=user.get("address")
        )
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# New login route
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    user_or_email = data.get("userOrEmail")
    password = data.get("password")
    if not user_or_email or not password:
        return JSONResponse({"error": "Missing credentials"}, status_code=400)
    conn = sqlite3.connect("your_db_name.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE (username=? OR email=?) AND password=?",
        (user_or_email, user_or_email, password)
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"message": "Login successful"}
    else:
        return JSONResponse({"error": "Invalid username/email or password"}, status_code=401)

@app.get("/profile")
async def get_profile(user_or_email: str):
    conn = sqlite3.connect("your_db_name.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name, username, email, phone, address FROM users WHERE username=? OR email=?",
        (user_or_email, user_or_email)
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "name": user[0],
            "username": user[1],
            "email": user[2],
            "phone": user[3],      # Use 'phone' for clarity
            "address": user[4]
        }
    else:
        return JSONResponse({"error": "User not found"}, status_code=404)

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI Voice Agent Interview Platform Backend Running"}

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            # Placeholder: Process audio bytes here
            # For MVP, just echo back
            await websocket.send_bytes(data)
    except WebSocketDisconnect:
        pass
