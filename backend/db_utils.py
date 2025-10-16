import sqlite3
import json
import os
import traceback
from datetime import datetime
from typing import Optional, Dict, Any, List, Union, Tuple

# Import database configuration
from config import DATABASE_PATH as DB_PATH, DATABASE_URL

# Optional Postgres driver
try:
    import psycopg2
except Exception:
    psycopg2 = None

# Print database info
print(f"\n{'='*50}")
print(f"Database Configuration")
print(f"{'='*50}")
print(f"Database path/URL: {DB_PATH}")
try:
    exists = os.path.exists(DB_PATH)
except Exception:
    exists = False
print(f"Database exists: {'Yes' if exists else 'No'}")
print(f"Using Postgres: {'Yes' if DATABASE_URL else 'No'}")
print(f"{'='*50}\n")


DB_TIMEOUT = 30.0  # seconds
DB_ISOLATION_LEVEL = "IMMEDIATE"  # Use EXCLUSIVE for single writer, or IMMEDIATE for multiple readers/single writer


class DatabaseError(Exception):
    """Custom exception for database-related errors."""
    pass


class PGCursorWrapper:
    """Wrap psycopg2 cursor to accept SQLite-style '?' placeholders by converting to '%s'."""
    def __init__(self, cur):
        self._cur = cur

    def execute(self, sql, params=()):
        if sql is None:
            return self._cur.execute(sql, params)
        sql_adapted = sql.replace('?', '%s')
        return self._cur.execute(sql_adapted, params)

    def executemany(self, sql, seq_of_params):
        sql_adapted = sql.replace('?', '%s')
        return self._cur.executemany(sql_adapted, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def __getattr__(self, name):
        return getattr(self._cur, name)


class PGConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return PGCursorWrapper(self._conn.cursor())

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


def get_connection():
    """Return a DB connection. If DATABASE_URL is set and psycopg2 is available,
    return a Postgres connection wrapped to accept '?' placeholders. Otherwise
    return a configured sqlite3.Connection.
    """
    # If DATABASE_URL is set and psycopg2 is available, use Postgres
    if DATABASE_URL and psycopg2:
        try:
            raw_conn = psycopg2.connect(DATABASE_URL)
            return PGConnectionWrapper(raw_conn)
        except Exception as e:
            print(f"Postgres connection failed: {e}")
            raise DatabaseError(f"Failed to connect to Postgres: {e}")

    # Fallback to sqlite3
    try:
        # Create parent directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)

        conn = sqlite3.connect(
            database=DB_PATH,
            timeout=DB_TIMEOUT,
            isolation_level=DB_ISOLATION_LEVEL,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        )

        # Optimize database settings for sqlite only
        try:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA temp_store = MEMORY")
            conn.execute("PRAGMA mmap_size = 30000000000")
        except Exception:
            # PRAGMA may not be supported or may fail in restricted environments
            pass

        return conn
    except sqlite3.Error as e:
        print(f"SQLite connection error: {e}")
        print(f"Database path: {os.path.abspath(DB_PATH)}")
        print(f"Current working directory: {os.getcwd()}")
        raise DatabaseError(f"Failed to connect to database: {e}")

def execute_query(query: str, params: tuple = (), fetch: bool = True) -> Union[List[Dict[str, Any]], int]:
    """Execute a SQL query and return results as a list of dictionaries."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Execute the query
        cursor.execute(query, params)
        
        # For SELECT queries, return results as list of dicts
        if fetch and query.strip().upper().startswith('SELECT'):
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        # For INSERT, UPDATE, DELETE, return number of affected rows
        elif not fetch:
            conn.commit()
            return cursor.rowcount
        
        return []
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Query failed: {e}")
        print(f"Query: {query}")
        print(f"Parameters: {params}")
        traceback.print_exc()
        raise DatabaseError(f"Database operation failed: {e}")
    finally:
        if conn:
            conn.close()

def init_db():
    """Initialize the database with required tables if they don't exist."""
    # If a managed Postgres is configured, skip running the SQLite schema
    # here — use `backend/init_render_db.py` which contains Postgres-compatible
    # DDL. This avoids running SQLite-specific SQL (AUTOINCREMENT, PRAGMA, etc.)
    if DATABASE_URL:
        print("DATABASE_URL detected; skipping local sqlite init_db() — use init_render_db.py for Postgres schema")
        return True

    try:
        # Users table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                username TEXT,
                gmail TEXT NOT NULL UNIQUE,
                email TEXT,
                password TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                profile_pic TEXT,
                role TEXT DEFAULT 'User',
                language TEXT DEFAULT 'English',
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                last_login TEXT,
                is_active BOOLEAN DEFAULT 1,
                reset_token TEXT,
                reset_token_expires TEXT
            )
            """,
            fetch=False,
        )

        # Add indexes for better performance
        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            """,
            fetch=False,
        )

        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_users_gmail ON users(gmail);
            """,
            fetch=False,
        )

        # Interview sessions table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                user_email TEXT NOT NULL,
                role TEXT NOT NULL,
                interview_mode TEXT DEFAULT 'standard',
                status TEXT DEFAULT 'active',
                start_time TEXT DEFAULT (datetime('now', 'localtime')),
                end_time TEXT,
                total_questions INTEGER DEFAULT 0,
                questions_answered INTEGER DEFAULT 0,
                current_question_index INTEGER DEFAULT 0,
                session_data TEXT,
                resume_analysis TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT,
                FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
            )
            """,
            fetch=False,
        )

        # Interview questions table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS interview_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                question_index INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT DEFAULT 'text',
                category TEXT,
                difficulty TEXT DEFAULT 'medium',
                asked_at TEXT DEFAULT (datetime('now', 'localtime')),
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                UNIQUE(session_id, question_index)
            )
            """,
            fetch=False,
        )

        # User responses table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS user_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                question_id INTEGER NOT NULL,
                user_answer TEXT,
                audio_file_path TEXT,
                response_duration REAL,
                confidence_score REAL,
                emotion_detected TEXT,
                analysis_result TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
            )
            """,
            fetch=False,
        )

        # Enhanced transcripts table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                transcript_data TEXT NOT NULL,
                raw_audio_path TEXT,
                processed_audio_path TEXT,
                word_timestamps TEXT,
                confidence_scores TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (user_email) REFERENCES users(email)
            )
            """,
            fetch=False,
        )

        # Enhanced feedback table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                overall_score REAL,
                technical_score REAL,
                communication_score REAL,
                problem_solving_score REAL,
                confidence_score REAL,
                categories TEXT,
                detailed_feedback TEXT,
                suggestions TEXT,
                strengths TEXT,
                areas_for_improvement TEXT,
                ai_generated_feedback TEXT,
                transcript TEXT,
                tts_feedback TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
                FOREIGN KEY (user_email) REFERENCES users(email)
            )
            """,
            fetch=False,
        )

        # Enhanced dashboard stats table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS dashboard_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                total_interviews INTEGER DEFAULT 0,
                completed_interviews INTEGER DEFAULT 0,
                avg_overall_score REAL DEFAULT 0,
                avg_technical_score REAL DEFAULT 0,
                avg_communication_score REAL DEFAULT 0,
                avg_problem_solving_score REAL DEFAULT 0,
                avg_confidence_score REAL DEFAULT 0,
                total_time_spent REAL DEFAULT 0,
                last_interview_date TEXT,
                best_score REAL DEFAULT 0,
                improvement_trend TEXT,
                updated_at TEXT
            )
            """,
            fetch=False,
        )

        # Interview analytics table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS interview_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                question_analytics TEXT,
                voice_metrics TEXT,
                response_patterns TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime'))
            )
            """,
            fetch=False,
        )

        print("Database schema initialized successfully")
        return True
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        traceback.print_exc()
        return False
def add_user(email, username, password, gmail=None):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Use email as gmail if gmail is not provided, since gmail field is NOT NULL
        gmail_value = gmail if gmail is not None and gmail.strip() else email
        if not gmail_value or not gmail_value.strip():
            raise ValueError("Email address is required")
        cursor.execute(
            """
            INSERT INTO users (email, username, password, gmail)
            VALUES (?, ?, ?, ?)
            """,
            (email, username, password, gmail_value),
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        print("IntegrityError:", e)
        raise
    finally:
        if conn:
            conn.close()

def save_dashboard_stats(name, email, interviews_completed, avg_feedback_score, last_interview_date):
    conn = get_connection()
    cursor = conn.cursor()
    
    # First try the new schema
    try:
        cursor.execute("""
            INSERT INTO dashboard_stats (user_email, total_interviews, completed_interviews, avg_overall_score, last_interview_date)
            VALUES (?, ?, ?, ?, ?)
        """, (email, interviews_completed, interviews_completed, avg_feedback_score, last_interview_date))
    except sqlite3.OperationalError:
        # Fallback to old schema
        cursor.execute("""
            INSERT INTO dashboard_stats (name, email, interviews_completed, avg_feedback_score, last_interview_date)
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, interviews_completed, avg_feedback_score, last_interview_date))
    
    conn.commit()
    conn.close()

def update_user_profile(email, name, username, phone, address, profile_pic=None):
    conn = get_connection()
    cursor = conn.cursor()
    if profile_pic is not None:
        cursor.execute("""
            UPDATE users SET name=?, username=?, phone=?, address=?, profile_pic=? WHERE email=?
        """, (name, username, phone, address, profile_pic, email))
    else:
        cursor.execute("""
            UPDATE users SET name=?, username=?, phone=?, address=? WHERE email=?
        """, (name, username, phone, address, email))
    conn.commit()
    conn.close()

def get_dashboard_stats(email):
    conn = get_connection()
    cursor = conn.cursor()
    
    # First try the new schema
    try:
        cursor.execute("""
            SELECT total_interviews, completed_interviews, avg_overall_score, last_interview_date
            FROM dashboard_stats WHERE user_email=? ORDER BY id DESC LIMIT 1
        """, (email,))
        row = cursor.fetchone()
        if row:
            return {
                "interviewsCompleted": row[0],
                "avgFeedbackScore": row[2],
                "lastInterviewDate": row[3]
            }
    except sqlite3.OperationalError:
        # Fallback to old schema
        try:
            cursor.execute("""
                SELECT interviews_completed, avg_feedback_score, last_interview_date
                FROM dashboard_stats WHERE email=? ORDER BY id DESC LIMIT 1
            """, (email,))
            row = cursor.fetchone()
            if row:
                return {
                    "interviewsCompleted": row[0],
                    "avgFeedbackScore": row[1],
                    "lastInterviewDate": row[2]
                }
        except sqlite3.OperationalError:
            pass
    
    conn.close()
    return None

def save_feedback(email, session_id, overall_score, categories, suggestions, transcript, tts_feedback):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Try to insert with both old and new column names to handle the transition
    try:
        cursor.execute("""
            INSERT INTO feedback (user_email, session_id, overall_score, categories, suggestions, transcript, tts_feedback, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (email, session_id, overall_score, categories, suggestions, transcript, tts_feedback, email))
    except sqlite3.OperationalError:
        # Fallback to just new columns
        cursor.execute("""
            INSERT INTO feedback (user_email, session_id, overall_score, categories, suggestions, transcript, tts_feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, session_id, overall_score, categories, suggestions, transcript, tts_feedback))
    
    conn.commit()
    conn.close()

def get_feedback(email, session_id=None):
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        cursor.execute("SELECT overall_score, categories, suggestions, transcript, tts_feedback FROM feedback WHERE user_email=? AND session_id=? ORDER BY id DESC LIMIT 1", (email, session_id))
    else:
        cursor.execute("SELECT overall_score, categories, suggestions, transcript, tts_feedback FROM feedback WHERE user_email=? ORDER BY id DESC LIMIT 1", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "overallScore": row[0],
            "categories": row[1],
            "suggestions": row[2],
            "transcript": row[3],
            "ttsFeedback": row[4]
        }
    return None

def get_feedback_enhanced(email, session_id=None):
    """Get enhanced feedback data including transcript"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if session_id:
        cursor.execute("""
            SELECT overall_score, technical_score, communication_score, problem_solving_score, 
                   confidence_score, categories, detailed_feedback, suggestions, strengths, 
                   areas_for_improvement, ai_generated_feedback, transcript, tts_feedback, 
                   session_id, created_at
            FROM feedback 
            WHERE user_email=? AND session_id=? 
            ORDER BY id DESC LIMIT 1
        """, (email, session_id))
    else:
        cursor.execute("""
            SELECT overall_score, technical_score, communication_score, problem_solving_score, 
                   confidence_score, categories, detailed_feedback, suggestions, strengths, 
                   areas_for_improvement, ai_generated_feedback, transcript, tts_feedback, 
                   session_id, created_at
            FROM feedback 
            WHERE user_email=? 
            ORDER BY id DESC LIMIT 1
        """, (email,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "overallScore": row[0],
            "technicalScore": row[1],
            "communicationScore": row[2],
            "problemSolvingScore": row[3],
            "confidenceScore": row[4],
            "categories": row[5],
            "detailedFeedback": row[6],
            "suggestions": row[7],
            "strengths": row[8],
            "areasForImprovement": row[9],
            "aiGeneratedFeedback": row[10],
            "transcript": row[11],
            "ttsFeedback": row[12],
            "sessionId": row[13],
            "createdAt": row[14]
        }
    return None

def save_transcript(email, session_id, data):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Try to insert with both old and new column names to handle the transition
    try:
        cursor.execute("""
            INSERT INTO transcripts (user_email, session_id, transcript_data, email, data)
            VALUES (?, ?, ?, ?, ?)
        """, (email, session_id, data, email, data))
    except sqlite3.OperationalError:
        # Fallback to just new columns
        cursor.execute("""
            INSERT INTO transcripts (user_email, session_id, transcript_data)
            VALUES (?, ?, ?)
        """, (email, session_id, data))
    
    conn.commit()
    conn.close()

def get_transcripts(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, transcript_data, created_at FROM transcripts WHERE user_email=? ORDER BY id DESC", (email,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {"sessionId": row[0], "data": row[1], "createdAt": row[2]} for row in rows
    ]

def clear_transcripts(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transcripts WHERE user_email=?", (email,))
    conn.commit()
    conn.close()

def change_user_password(email, current_password, new_password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE email=?", (email,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False  # User not found
    if row[0] != current_password:
        conn.close()
        return False  # Current password incorrect
    cursor.execute("UPDATE users SET password=? WHERE email=?", (new_password, email))
    conn.commit()
    conn.close()
    return True

def get_user_language(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT language FROM users WHERE email=?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0]
    return None

def update_user_language(email, language):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET language=? WHERE email=?", (language, email))
    conn.commit()
    conn.close()

def start_interview_session(user_email, role, interview_mode="standard", resume_analysis=None):
    """Start a new interview session"""
    import uuid
    import json
    session_id = str(uuid.uuid4())
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Convert resume_analysis to JSON string if provided
        resume_data = json.dumps(resume_analysis) if resume_analysis else None
        
        cursor.execute("""
            INSERT INTO interview_sessions (session_id, user_email, role, interview_mode, status, resume_analysis)
            VALUES (?, ?, ?, ?, 'active', ?)
        """, (session_id, user_email, role, interview_mode, resume_data))
        
        # Initialize dashboard stats if not exists
        cursor.execute("""
            INSERT OR IGNORE INTO dashboard_stats (user_email, total_interviews)
            VALUES (?, 0)
        """, (user_email,))
        
        conn.commit()
        return session_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def end_interview_session(session_id):
    """End an interview session"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE interview_sessions 
            SET status = 'completed', end_time = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (session_id,))
        
        # Update dashboard stats
        cursor.execute("""
            UPDATE dashboard_stats 
            SET total_interviews = total_interviews + 1,
                completed_interviews = completed_interviews + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_email = (
                SELECT user_email FROM interview_sessions WHERE session_id = ?
            )
        """, (session_id,))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def add_interview_question(session_id, question_text, question_type="text", category=None, difficulty="medium"):
    """Add a question to an interview session"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO interview_questions (session_id, question_index, question_text, question_type, category, difficulty)
            VALUES (?, (SELECT COALESCE(MAX(question_index), 0) + 1 FROM interview_questions WHERE session_id = ?), ?, ?, ?, ?)
        """, (session_id, session_id, question_text, question_type, category, difficulty))
        
        # Update session question count
        cursor.execute("""
            UPDATE interview_sessions 
            SET total_questions = total_questions + 1
            WHERE session_id = ?
        """, (session_id,))
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_user_response(session_id, question_id, user_answer, audio_file_path=None, response_duration=None, confidence_score=None):
    """Save user response to a question"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO user_responses (session_id, question_id, user_answer, audio_file_path, response_duration, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, question_id, user_answer, audio_file_path, response_duration, confidence_score))
        
        # Update session questions answered count
        cursor.execute("""
            UPDATE interview_sessions 
            SET questions_answered = questions_answered + 1
            WHERE session_id = ?
        """, (session_id,))
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_transcript_enhanced(session_id, user_email, transcript_data, raw_audio_path=None, processed_audio_path=None, word_timestamps=None, confidence_scores=None):
    """Save enhanced transcript with more detailed information"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Convert data to JSON if needed
        if isinstance(transcript_data, dict):
            transcript_data = json.dumps(transcript_data)
        if isinstance(word_timestamps, list):
            word_timestamps = json.dumps(word_timestamps)
        if isinstance(confidence_scores, list):
            confidence_scores = json.dumps(confidence_scores)
        
        # Try to insert with both old and new column names to handle the transition
        try:
            cursor.execute("""
                INSERT INTO transcripts (session_id, user_email, transcript_data, raw_audio_path, processed_audio_path, word_timestamps, confidence_scores, email, data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_email, transcript_data, raw_audio_path, processed_audio_path, word_timestamps, confidence_scores, user_email, transcript_data))
        except sqlite3.OperationalError:
            # Fallback to just new columns
            cursor.execute("""
                INSERT INTO transcripts (session_id, user_email, transcript_data, raw_audio_path, processed_audio_path, word_timestamps, confidence_scores)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_email, transcript_data, raw_audio_path, processed_audio_path, word_timestamps, confidence_scores))
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_feedback_enhanced(session_id, user_email, overall_score, technical_score=None, communication_score=None, problem_solving_score=None, confidence_score=None, categories=None, detailed_feedback=None, suggestions=None, strengths=None, areas_for_improvement=None, ai_generated_feedback=None, transcript=None, tts_feedback=None):
    """Save enhanced feedback with detailed scoring"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Convert categories to JSON if needed
        if isinstance(categories, dict):
            categories = json.dumps(categories)
        
        # Convert transcript to JSON if needed
        if isinstance(transcript, list):
            transcript = json.dumps(transcript)
        
        # Try to insert with both old and new column names to handle the transition
        try:
            cursor.execute("""
                INSERT INTO feedback (session_id, user_email, overall_score, technical_score, communication_score, problem_solving_score, confidence_score, categories, detailed_feedback, suggestions, strengths, areas_for_improvement, ai_generated_feedback, transcript, tts_feedback, email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_email, overall_score, technical_score, communication_score, problem_solving_score, confidence_score, categories, detailed_feedback, suggestions, strengths, areas_for_improvement, ai_generated_feedback, transcript, tts_feedback, user_email))
        except sqlite3.OperationalError:
            # Fallback to just new columns
            cursor.execute("""
                INSERT INTO feedback (session_id, user_email, overall_score, technical_score, communication_score, problem_solving_score, confidence_score, categories, detailed_feedback, suggestions, strengths, areas_for_improvement, ai_generated_feedback, transcript, tts_feedback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_email, overall_score, technical_score, communication_score, problem_solving_score, confidence_score, categories, detailed_feedback, suggestions, strengths, areas_for_improvement, ai_generated_feedback, transcript, tts_feedback))
        
        # Update dashboard stats with new scores
        cursor.execute("""
            UPDATE dashboard_stats 
            SET avg_overall_score = (
                SELECT AVG(overall_score) FROM feedback WHERE user_email = ?
            ),
            avg_technical_score = (
                SELECT AVG(technical_score) FROM feedback WHERE user_email = ? AND technical_score IS NOT NULL
            ),
            avg_communication_score = (
                SELECT AVG(communication_score) FROM feedback WHERE user_email = ? AND communication_score IS NOT NULL
            ),
            avg_problem_solving_score = (
                SELECT AVG(problem_solving_score) FROM feedback WHERE user_email = ? AND problem_solving_score IS NOT NULL
            ),
            avg_confidence_score = (
                SELECT AVG(confidence_score) FROM feedback WHERE user_email = ? AND confidence_score IS NOT NULL
            ),
            best_score = (
                SELECT MAX(overall_score) FROM feedback WHERE user_email = ?
            ),
            last_interview_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
            WHERE user_email = ?
        """, (user_email, user_email, user_email, user_email, user_email, user_email, user_email))
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_interview_session(session_id):
    """Get interview session details"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT session_id, user_email, role, interview_mode, status, start_time, end_time, 
               total_questions, questions_answered, current_question_index, session_data
        FROM interview_sessions WHERE session_id = ?
    """, (session_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "sessionId": row[0],
            "userEmail": row[1],
            "role": row[2],
            "interviewMode": row[3],
            "status": row[4],
            "startTime": row[5],
            "endTime": row[6],
            "totalQuestions": row[7],
            "questionsAnswered": row[8],
            "currentQuestionIndex": row[9],
            "sessionData": row[10]
        }
    return None

def get_user_interview_history(user_email, limit=10):
    """Get user's interview history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.session_id, s.role, s.interview_mode, s.status, s.start_time, s.end_time,
               s.total_questions, s.questions_answered, f.overall_score
        FROM interview_sessions s
        LEFT JOIN feedback f ON s.session_id = f.session_id
        WHERE s.user_email = ?
        ORDER BY s.start_time DESC
        LIMIT ?
    """, (user_email, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "sessionId": row[0],
            "role": row[1],
            "interviewMode": row[2],
            "status": row[3],
            "startTime": row[4],
            "endTime": row[5],
            "totalQuestions": row[6],
            "questionsAnswered": row[7],
            "overallScore": row[8]
        } for row in rows
    ]

def get_dashboard_stats_enhanced(user_email):
    """Get enhanced dashboard statistics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # First check if the dashboard_stats table exists
        cursor.execute("""
            SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_stats'
        """)
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            # Table doesn't exist, return default stats
            conn.close()
            return {
                "totalInterviews": 0,
                "completedInterviews": 0,
                "avgOverallScore": 0,
                "avgTechnicalScore": 0,
                "avgCommunicationScore": 0,
                "avgProblemSolvingScore": 0,
                "avgConfidenceScore": 0,
                "totalTimeSpent": 0,
                "lastInterviewDate": None,
                "bestScore": 0,
                "improvementTrend": None
            }
        
        # Check if user_email column exists
        cursor.execute("PRAGMA table_info(dashboard_stats)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'user_email' not in columns:
            # Column doesn't exist, return default stats
            conn.close()
            return {
                "totalInterviews": 0,
                "completedInterviews": 0,
                "avgOverallScore": 0,
                "avgTechnicalScore": 0,
                "avgCommunicationScore": 0,
                "avgProblemSolvingScore": 0,
                "avgConfidenceScore": 0,
                "totalTimeSpent": 0,
                "lastInterviewDate": None,
                "bestScore": 0,
                "improvementTrend": None
            }
        
        cursor.execute("""
            SELECT total_interviews, completed_interviews, avg_overall_score, avg_technical_score,
                   avg_communication_score, avg_problem_solving_score, avg_confidence_score,
                   total_time_spent, last_interview_date, best_score, improvement_trend
            FROM dashboard_stats WHERE user_email = ?
        """, (user_email,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "totalInterviews": row[0] or 0,
                "completedInterviews": row[1] or 0,
                "avgOverallScore": row[2] or 0,
                "avgTechnicalScore": row[3] or 0,
                "avgCommunicationScore": row[4] or 0,
                "avgProblemSolvingScore": row[5] or 0,
                "avgConfidenceScore": row[6] or 0,
                "totalTimeSpent": row[7] or 0,
                "lastInterviewDate": row[8],
                "bestScore": row[9] or 0,
                "improvementTrend": row[10]
            }
        else:
            # User has no stats yet, return default values
            return {
                "totalInterviews": 0,
                "completedInterviews": 0,
                "avgOverallScore": 0,
                "avgTechnicalScore": 0,
                "avgCommunicationScore": 0,
                "avgProblemSolvingScore": 0,
                "avgConfidenceScore": 0,
                "totalTimeSpent": 0,
                "lastInterviewDate": None,
                "bestScore": 0,
                "improvementTrend": None
            }
    except Exception as e:
        # If any error occurs, return default stats
        conn.close()
        return {
            "totalInterviews": 0,
            "completedInterviews": 0,
            "avgOverallScore": 0,
            "avgTechnicalScore": 0,
            "avgCommunicationScore": 0,
            "avgProblemSolvingScore": 0,
            "avgConfidenceScore": 0,
            "totalTimeSpent": 0,
            "lastInterviewDate": None,
            "bestScore": 0,
            "improvementTrend": None
        }

def save_interview_analytics(session_id, user_email, question_analytics=None, voice_metrics=None, response_patterns=None):
    """Save interview analytics data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Convert data to JSON if needed
        if isinstance(question_analytics, dict):
            question_analytics = json.dumps(question_analytics)
        if isinstance(voice_metrics, dict):
            voice_metrics = json.dumps(voice_metrics)
        if isinstance(response_patterns, dict):
            response_patterns = json.dumps(response_patterns)
        
        cursor.execute("""
            INSERT INTO interview_analytics (session_id, user_email, question_analytics, voice_metrics, response_patterns)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, user_email, question_analytics, voice_metrics, response_patterns))
        
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_dashboard_stats_after_interview(user_email, overall_score):
    """Update dashboard stats after an interview is completed"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get current stats
        cursor.execute("""
            SELECT total_interviews, completed_interviews, avg_overall_score, best_score
            FROM dashboard_stats 
            WHERE user_email = ?
        """, (user_email,))
        
        result = cursor.fetchone()
        
        if result:
            total_interviews, completed_interviews, avg_overall_score, best_score = result
            
            # Update stats
            new_total_interviews = total_interviews + 1
            new_completed_interviews = completed_interviews + 1
            
            # Calculate new average
            if avg_overall_score is None or avg_overall_score == 0:
                new_avg_score = overall_score
            else:
                new_avg_score = ((avg_overall_score * completed_interviews) + overall_score) / new_completed_interviews
            
            # Update best score
            new_best_score = max(best_score or 0, overall_score)
            
            cursor.execute("""
                UPDATE dashboard_stats 
                SET 
                    total_interviews = ?,
                    completed_interviews = ?,
                    avg_overall_score = ?,
                    best_score = ?,
                    last_interview_date = ?,
                    updated_at = ?
                WHERE user_email = ?
            """, (new_total_interviews, new_completed_interviews, new_avg_score, new_best_score, 
                  datetime.now().isoformat(), datetime.now().isoformat(), user_email))
        else:
            # Create new stats record
            cursor.execute("""
                INSERT INTO dashboard_stats (
                    user_email, total_interviews, completed_interviews, 
                    avg_overall_score, best_score, last_interview_date
                ) VALUES (?, 1, 1, ?, ?, ?)
            """, (user_email, overall_score, overall_score, datetime.now().isoformat()))
        
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# Initialize the database and tables first
init_db()

# Sample query to fetch user details
# conn = sqlite3.connect(DB_PATH)
# cursor = conn.cursor()
# cursor.execute("SELECT name, username, email, phone, address FROM users WHERE username=? OR email=?", ("jonnyroria@gmail.com", "jonnyroria@gmail.com"))
# print(cursor.fetchone())
# conn.close()
