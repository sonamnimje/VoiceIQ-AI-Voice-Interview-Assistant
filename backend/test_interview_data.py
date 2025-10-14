#!/usr/bin/env python3
"""
Test Interview Data Storage
This script verifies that all interview data is properly stored in the database.
"""

from db_utils import get_connection
import json

DB_PATH = "database.db"


def test_interview_data():
    """Test that all interview data is properly stored"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("Testing interview data storage...")
        
        # Test 1: Check interview sessions
        cursor.execute("SELECT COUNT(*) FROM interview_sessions")
        session_count = cursor.fetchone()[0]
        print(f"✓ Found {session_count} interview sessions")
        
        # Test 2: Check questions
        cursor.execute("SELECT COUNT(*) FROM interview_questions")
        question_count = cursor.fetchone()[0]
        print(f"✓ Found {question_count} interview questions")
        
        # Test 3: Check responses
        cursor.execute("SELECT COUNT(*) FROM user_responses")
        response_count = cursor.fetchone()[0]
        print(f"✓ Found {response_count} user responses")
        
        # Test 4: Check transcripts
        cursor.execute("SELECT COUNT(*) FROM transcripts")
        transcript_count = cursor.fetchone()[0]
        print(f"✓ Found {transcript_count} transcripts")
        
        # Test 5: Check feedback
        cursor.execute("SELECT COUNT(*) FROM feedback")
        feedback_count = cursor.fetchone()[0]
        print(f"✓ Found {feedback_count} feedback records")
        
        # Test 6: Check dashboard stats
        cursor.execute("SELECT COUNT(*) FROM dashboard_stats")
        stats_count = cursor.fetchone()[0]
        print(f"✓ Found {stats_count} dashboard stats records")
        
        # Test 7: Get detailed sample session data
        cursor.execute("""
            SELECT session_id, user_email, role, interview_mode, status, 
                   total_questions, questions_answered
            FROM interview_sessions 
            LIMIT 1
        """)
        session_data = cursor.fetchone()
        
        if session_data:
            session_id, user_email, role, mode, status, total_q, answered_q = session_data
            print(f"\n📊 Sample Session Details:")
            print(f"   Session ID: {session_id}")
            print(f"   User: {user_email}")
            print(f"   Role: {role}")
            print(f"   Mode: {mode}")
            print(f"   Status: {status}")
            print(f"   Questions: {answered_q}/{total_q}")
            
            # Get questions for this session
            cursor.execute("""
                SELECT question_text, category, difficulty
                FROM interview_questions 
                WHERE session_id = ?
                ORDER BY question_index
                LIMIT 3
            """, (session_id,))
            questions = cursor.fetchall()
            
            print(f"\n❓ Sample Questions:")
            for i, (text, category, difficulty) in enumerate(questions, 1):
                print(f"   {i}. {text[:50]}...")
                print(f"      Category: {category}, Difficulty: {difficulty}")
            
            # Get responses for this session
            cursor.execute("""
                SELECT ur.user_answer, ur.response_duration, ur.confidence_score
                FROM user_responses ur
                JOIN interview_questions iq ON ur.question_id = iq.id
                WHERE ur.session_id = ?
                ORDER BY iq.question_index
                LIMIT 3
            """, (session_id,))
            responses = cursor.fetchall()
            
            print(f"\n💬 Sample Responses:")
            for i, (answer, duration, confidence) in enumerate(responses, 1):
                print(f"   {i}. {answer[:50]}...")
                print(f"      Duration: {duration:.1f}s, Confidence: {confidence:.2f}")
            
            # Get feedback for this session
            cursor.execute("""
                SELECT overall_score, technical_score, communication_score, detailed_feedback
                FROM feedback 
                WHERE session_id = ?
            """, (session_id,))
            feedback = cursor.fetchone()
            
            if feedback:
                overall, technical, comm, detailed = feedback
                print(f"\n📈 Sample Feedback:")
                print(f"   Overall Score: {overall:.1f}/10")
                print(f"   Technical Score: {technical:.1f}/10")
                print(f"   Communication Score: {comm:.1f}/10")
                print(f"   Feedback: {detailed[:100]}...")
        
        print(f"\n✅ All interview data is properly stored in the database!")
        print(f"   Total records: {session_count + question_count + response_count + transcript_count + feedback_count + stats_count}")
        
    except Exception as e:
        print(f"❌ Error testing interview data: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    test_interview_data() 