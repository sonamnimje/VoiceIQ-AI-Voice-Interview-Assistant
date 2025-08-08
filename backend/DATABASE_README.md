# Enhanced Database Documentation

This document describes the enhanced database structure for storing interview sessions, transcripts, feedback, and dashboard data.

## Database Structure

### Tables Overview

1. **users** - Enhanced user information
2. **interview_sessions** - Interview session management
3. **interview_questions** - Questions asked during interviews
4. **user_responses** - User responses to questions
5. **transcripts** - Enhanced transcript storage
6. **feedback** - Detailed feedback and scoring
7. **dashboard_stats** - User performance statistics
8. **interview_analytics** - Analytics and metrics

### Table Details

#### 1. users (Enhanced)
```sql
CREATE TABLE users (
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. interview_sessions
```sql
CREATE TABLE interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL,
    interview_mode TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,
    total_questions INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    current_question_index INTEGER DEFAULT 0,
    session_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
)
```

#### 3. interview_questions
```sql
CREATE TABLE interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'text',
    category TEXT,
    difficulty TEXT DEFAULT 'medium',
    asked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id)
)
```

#### 4. user_responses
```sql
CREATE TABLE user_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    user_answer TEXT,
    audio_file_path TEXT,
    response_duration REAL,
    confidence_score REAL,
    emotion_detected TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (question_id) REFERENCES interview_questions(id)
)
```

#### 5. transcripts (Enhanced)
```sql
CREATE TABLE transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    transcript_data TEXT NOT NULL,
    raw_audio_path TEXT,
    processed_audio_path TEXT,
    word_timestamps TEXT,
    confidence_scores TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (user_email) REFERENCES users(email)
)
```

#### 6. feedback (Enhanced)
```sql
CREATE TABLE feedback (
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (user_email) REFERENCES users(email)
)
```

#### 7. dashboard_stats (Enhanced)
```sql
CREATE TABLE dashboard_stats (
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
)
```

#### 8. interview_analytics
```sql
CREATE TABLE interview_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    question_analytics TEXT,
    emotion_analysis TEXT,
    voice_metrics TEXT,
    response_patterns TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(session_id),
    FOREIGN KEY (user_email) REFERENCES users(email)
)
```

## API Endpoints

### Interview Session Management

#### Start Interview
```http
POST /api/interview/start
Content-Type: application/json

{
    "userEmail": "user@example.com",
    "role": "Software Engineer",
    "interviewMode": "standard"
}
```

#### End Interview
```http
POST /api/interview/end
Content-Type: application/json

{
    "sessionId": "uuid-session-id"
}
```

#### Get Session Details
```http
GET /api/interview/session/{session_id}
```

#### Get Interview History
```http
GET /api/interview/history/{user_email}?limit=10
```

### Question Management

#### Add Question
```http
POST /api/interview/question
Content-Type: application/json

{
    "sessionId": "uuid-session-id",
    "questionText": "What is object-oriented programming?",
    "questionType": "text",
    "category": "Programming",
    "difficulty": "medium"
}
```

#### Save User Response
```http
POST /api/interview/response
Content-Type: application/json

{
    "sessionId": "uuid-session-id",
    "questionId": 1,
    "userAnswer": "OOP is a programming paradigm...",
    "audioFilePath": "/path/to/audio.wav",
    "responseDuration": 45.2,
    "confidenceScore": 0.85,
    "emotionDetected": "confident"
}
```

### Data Storage

#### Save Transcript
```http
POST /api/transcript/save
Content-Type: application/json

{
    "sessionId": "uuid-session-id",
    "userEmail": "user@example.com",
    "transcriptData": "{\"full_transcript\": \"...\", \"segments\": [...]}",
    "rawAudioPath": "/path/to/raw.wav",
    "processedAudioPath": "/path/to/processed.wav",
    "wordTimestamps": "[{\"word\": \"hello\", \"start\": 0.0, \"end\": 0.5}]",
    "confidenceScores": "[0.95, 0.88, 0.92]"
}
```

#### Save Feedback
```http
POST /api/feedback/save
Content-Type: application/json

{
    "sessionId": "uuid-session-id",
    "userEmail": "user@example.com",
    "overallScore": 8.5,
    "technicalScore": 9.0,
    "communicationScore": 8.0,
    "problemSolvingScore": 8.5,
    "confidenceScore": 8.2,
    "categories": "{\"technical_knowledge\": 9.0, \"communication\": 8.0}",
    "detailedFeedback": "Excellent technical knowledge...",
    "suggestions": "Practice explaining technical concepts...",
    "strengths": "Strong understanding of programming...",
    "areasForImprovement": "Could provide more detailed examples...",
    "aiGeneratedFeedback": "AI analysis shows strong technical competency..."
}
```

#### Save Analytics
```http
POST /api/analytics/save
Content-Type: application/json

{
    "sessionId": "uuid-session-id",
    "userEmail": "user@example.com",
    "questionAnalytics": "{\"question_1\": {\"response_time\": 45.2, \"confidence\": 0.85}}",
    "emotionAnalysis": "{\"overall_emotion\": \"confident\", \"emotion_timeline\": [...]}",
    "voiceMetrics": "{\"speaking_rate\": 150, \"pitch_variation\": 0.7}",
    "responsePatterns": "{\"avg_response_time\": 67.4, \"confidence_trend\": \"increasing\"}"
}
```

### Dashboard and Statistics

#### Get Dashboard Stats
```http
GET /api/dashboard/stats/{user_email}
```

## Database Functions

### Core Functions

#### Session Management
- `start_interview_session(user_email, role, interview_mode)` - Start new session
- `end_interview_session(session_id)` - End session
- `get_interview_session(session_id)` - Get session details
- `get_user_interview_history(user_email, limit)` - Get user history

#### Question Management
- `add_interview_question(session_id, question_text, question_type, category, difficulty)` - Add question
- `save_user_response(session_id, question_id, user_answer, ...)` - Save response

#### Data Storage
- `save_transcript_enhanced(session_id, user_email, transcript_data, ...)` - Save transcript
- `save_feedback_enhanced(session_id, user_email, overall_score, ...)` - Save feedback
- `save_interview_analytics(session_id, user_email, ...)` - Save analytics

#### Statistics
- `get_dashboard_stats_enhanced(user_email)` - Get enhanced stats

## Usage Examples

### Complete Interview Workflow

```python
from db_utils import *

# 1. Start interview session
session_id = start_interview_session("user@example.com", "Software Engineer")

# 2. Add questions
question_id = add_interview_question(session_id, "What is OOP?", "text", "Programming", "easy")

# 3. Save user response
response_id = save_user_response(session_id, question_id, "OOP is...", confidence_score=0.85)

# 4. Save transcript
transcript_id = save_transcript_enhanced(session_id, "user@example.com", "Full transcript...")

# 5. Save feedback
feedback_id = save_feedback_enhanced(session_id, "user@example.com", 8.5, technical_score=9.0)

# 6. End session
end_interview_session(session_id)
```

### Running the Example

```bash
# Initialize database
python init_enhanced_db.py

# Run example usage
python example_usage.py

# Start the server
uvicorn main:app --reload
```

## Database Initialization

Run the initialization script to create all tables:

```bash
cd backend
python init_enhanced_db.py
```

This will:
- Create all necessary tables
- Add database indexes for performance
- Add sample data for testing
- Verify the database structure

## Performance Considerations

- Database indexes are created on frequently queried columns
- Foreign key constraints ensure data integrity
- JSON fields are used for flexible data storage
- Timestamps are automatically managed

## Data Types

- **TEXT**: For strings, JSON data, and timestamps
- **INTEGER**: For IDs and counts
- **REAL**: For scores and durations
- **JSON**: Stored as TEXT but parsed as JSON objects

## Error Handling

All functions include proper error handling:
- Database connection management
- Transaction rollback on errors
- Detailed error messages
- Data validation

## Security Notes

- Passwords should be hashed (currently stored as plain text for demo)
- Input validation is performed at the API level
- SQL injection is prevented using parameterized queries
- Foreign key constraints prevent orphaned data 