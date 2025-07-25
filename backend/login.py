from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import sqlite3
from db_utils import init_db

app = Flask(__name__)
CORS(app)
DB_PATH = "database.db"

# Initialize the database
init_db()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('userOrEmail')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE (username=? OR email=?) AND password=?", (username, username, password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({"success": True, "message": "Login successful!"})
    else:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

if __name__ == '__main__':
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cursor.fetchall())
    conn.close()
    app.run(debug=True)