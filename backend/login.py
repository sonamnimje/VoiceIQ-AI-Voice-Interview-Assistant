from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
from db_utils import init_db, get_connection

app = Flask(__name__)
CORS(app)

# Initialize the database
init_db()


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('userOrEmail')
    password = data.get('password')

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE (username=? OR email=?) AND password=?", (username, username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "message": "Login successful!"})
    else:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401


if __name__ == '__main__':
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        print(cursor.fetchall())
    except Exception:
        # If using Postgres, show public tables
        try:
            cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname='public';")
            print(cursor.fetchall())
        except Exception:
            pass
    finally:
        conn.close()
    app.run(debug=True)