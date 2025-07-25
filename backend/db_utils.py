import sqlite3

DB_PATH = "database.db"  # Use your existing database file

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            gmail TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            interviews_completed INTEGER,
            avg_feedback_score REAL,
            last_interview_date TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_user(name, username, gmail, email, password, phone=None, address=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, username, gmail, email, password, phone, address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, username, gmail, email, password, phone, address))
        conn.commit()
    except sqlite3.IntegrityError as e:
        print("IntegrityError:", e)
        raise
    finally:
        conn.close()

def save_dashboard_stats(name, email, interviews_completed, avg_feedback_score, last_interview_date):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO dashboard_stats (name, email, interviews_completed, avg_feedback_score, last_interview_date)
        VALUES (?, ?, ?, ?, ?)
    """, (name, email, interviews_completed, avg_feedback_score, last_interview_date))
    conn.commit()
    conn.close()

# Initialize the database and tables first
init_db()

# Sample query to fetch user details
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT name, username, email, phone, address FROM users WHERE username=? OR email=?", ("jonnyroria@gmail.com", "jonnyroria@gmail.com"))
print(cursor.fetchone())
conn.close()
