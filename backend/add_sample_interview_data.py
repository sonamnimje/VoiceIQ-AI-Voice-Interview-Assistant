#!/usr/bin/env python3
"""
Sample Interview Data Generator
This script adds sample interview data to demonstrate the enhanced database functionality.
"""

import sqlite3
from db_utils import init_db, get_connection
import json
import uuid
from datetime import datetime, timedelta
import random

DB_PATH = "database.db"

def add_sample_interview_data():
    """Add comprehensive sample interview data to the database"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("Adding sample interview data...")
        
        # Sample user email
        user_email = "sample@example.com"
        
        # Create sample interview sessions
        sample_sessions = [
            {
                "role": "Software Engineer",
                "interview_mode": "technical",
                "difficulty": "intermediate",
                "duration": 30
            },
            {
                "role": "Data Scientist", 
                "interview_mode": "mixed",
                "difficulty": "advanced",
                "duration": 45
            },
            {
                "role": "Product Manager",
                "interview_mode": "behavioral",
                "difficulty": "beginner",
                "duration": 25
            }
        ]
        
        for i, session_config in enumerate(sample_sessions):
            # Generate session ID
            session_id = f"sample_session_{i+1}_{uuid.uuid4().hex[:8]}"
            
            # Create interview session
            start_time = datetime.now() - timedelta(days=random.randint(1, 30))
            end_time = start_time + timedelta(minutes=session_config["duration"])
            
            cursor.execute("""
                INSERT INTO interview_sessions (
                    session_id, user_email, role, interview_mode, status,
                    start_time, end_time, total_questions, questions_answered,
                    current_question_index, session_data, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, user_email, session_config["role"], 
                session_config["interview_mode"], "completed",
                start_time.isoformat(), end_time.isoformat(),
                5, 5, 5, json.dumps({"sample": True}), start_time.isoformat()
            ))
            
            # Add sample questions
            questions = get_sample_questions(session_config["role"], session_config["interview_mode"])
            
            for j, question in enumerate(questions):
                question_id = cursor.execute("""
                    INSERT INTO interview_questions (
                        session_id, question_index, question_text, question_type,
                        category, difficulty, asked_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, j + 1, question["text"], "text",
                    question.get("category"), session_config["difficulty"],
                    (start_time + timedelta(minutes=j*5)).isoformat()
                )).lastrowid
                
                # Add sample response
                response = get_sample_response(question["text"], session_config["role"])
                
                cursor.execute("""
                    INSERT INTO user_responses (
                        session_id, question_id, user_answer, response_duration,
                        confidence_score, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    session_id, question_id, response["answer"],
                    response["duration"], response["confidence"],
                    (start_time + timedelta(minutes=j*5 + 2)).isoformat()
                ))
            
            # Add sample transcript
            transcript_data = {
                "full_transcript": " ".join([q["text"] + " " + get_sample_response(q["text"], session_config["role"])["answer"] for q in questions]),
                "segments": [
                    {
                        "start": i*5,
                        "end": i*5 + 2,
                        "text": get_sample_response(q["text"], session_config["role"])["answer"],
                        "speaker": "user"
                    } for i, q in enumerate(questions)
                ]
            }
            
            # Try to insert with both old and new column names to handle the transition
            try:
                cursor.execute("""
                    INSERT INTO transcripts (
                        session_id, user_email, transcript_data, email, data, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    session_id, user_email, json.dumps(transcript_data), user_email, json.dumps(transcript_data),
                    end_time.isoformat()
                ))
            except sqlite3.OperationalError:
                # Fallback to just new columns
                cursor.execute("""
                    INSERT INTO transcripts (
                        session_id, user_email, transcript_data, created_at
                    ) VALUES (?, ?, ?, ?)
                """, (
                    session_id, user_email, json.dumps(transcript_data),
                    end_time.isoformat()
                ))
            
            # Add sample feedback
            overall_score = random.uniform(7.0, 9.5)
            feedback_data = {
                "overall_score": overall_score,
                "technical_score": random.uniform(6.5, 9.0),
                "communication_score": random.uniform(7.0, 9.5),
                "problem_solving_score": random.uniform(6.0, 9.0),
                "confidence_score": random.uniform(6.5, 9.0),
                "categories": {
                    "technical_knowledge": random.uniform(7.0, 9.0),
                    "communication": random.uniform(7.0, 9.5),
                    "problem_solving": random.uniform(6.5, 9.0),
                    "experience": random.uniform(7.0, 9.0)
                },
                "detailed_feedback": f"Strong performance in {session_config['role']} interview. Good technical knowledge and communication skills.",
                "suggestions": "Consider practicing more system design questions and improving time management.",
                "strengths": "Good technical foundation, clear communication, relevant experience.",
                "areas_for_improvement": "System design, time management, advanced algorithms."
            }
            
            # Try to insert with both old and new column names to handle the transition
            try:
                cursor.execute("""
                    INSERT INTO feedback (
                        session_id, user_email, overall_score, technical_score,
                        communication_score, problem_solving_score, confidence_score,
                        categories, detailed_feedback, suggestions, strengths,
                        areas_for_improvement, email, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, user_email, feedback_data["overall_score"],
                    feedback_data["technical_score"], feedback_data["communication_score"],
                    feedback_data["problem_solving_score"], feedback_data["confidence_score"],
                    json.dumps(feedback_data["categories"]), feedback_data["detailed_feedback"],
                    feedback_data["suggestions"], feedback_data["strengths"],
                    feedback_data["areas_for_improvement"], user_email, end_time.isoformat()
                ))
            except sqlite3.OperationalError:
                # Fallback to just new columns
                cursor.execute("""
                    INSERT INTO feedback (
                        session_id, user_email, overall_score, technical_score,
                        communication_score, problem_solving_score, confidence_score,
                        categories, detailed_feedback, suggestions, strengths,
                        areas_for_improvement, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, user_email, feedback_data["overall_score"],
                    feedback_data["technical_score"], feedback_data["communication_score"],
                    feedback_data["problem_solving_score"], feedback_data["confidence_score"],
                    json.dumps(feedback_data["categories"]), feedback_data["detailed_feedback"],
                    feedback_data["suggestions"], feedback_data["strengths"],
                    feedback_data["areas_for_improvement"], end_time.isoformat()
                ))
            
            print(f"✓ Added sample session {i+1}: {session_config['role']} ({session_id})")
        
        # Update dashboard stats
        cursor.execute("""
            INSERT OR REPLACE INTO dashboard_stats (
                user_email, total_interviews, completed_interviews,
                avg_overall_score, best_score, last_interview_date
            ) VALUES (?, 3, 3, 8.2, 9.1, ?)
        """, (user_email, datetime.now().isoformat()))
        
        conn.commit()
        print("✓ Sample interview data added successfully!")
        print(f"✓ Added 3 sample interview sessions for user: {user_email}")
        print("✓ Each session includes questions, responses, transcripts, and feedback")
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding sample data: {e}")
        raise
    finally:
        conn.close()

def get_sample_questions(role, mode):
    """Get sample questions based on role and mode"""
    questions = {
        "Software Engineer": [
            {"text": "Can you explain the difference between a stack and a queue?", "category": "data_structures"},
            {"text": "How would you implement a hash table?", "category": "algorithms"},
            {"text": "What is the time complexity of binary search?", "category": "algorithms"},
            {"text": "Explain the concept of dependency injection.", "category": "design_patterns"},
            {"text": "How do you handle memory management in your applications?", "category": "system_design"}
        ],
        "Data Scientist": [
            {"text": "What machine learning algorithms are you most familiar with?", "category": "ml_algorithms"},
            {"text": "How do you handle missing data in your datasets?", "category": "data_preprocessing"},
            {"text": "Can you explain the bias-variance tradeoff?", "category": "ml_concepts"},
            {"text": "What's your experience with data visualization tools?", "category": "data_visualization"},
            {"text": "How do you validate your models?", "category": "model_validation"}
        ],
        "Product Manager": [
            {"text": "How do you prioritize features in a product roadmap?", "category": "product_strategy"},
            {"text": "Can you walk me through a product launch you managed?", "category": "product_execution"},
            {"text": "How do you gather and analyze user feedback?", "category": "user_research"},
            {"text": "What metrics do you track to measure product success?", "category": "analytics"},
            {"text": "How do you handle competing stakeholder requirements?", "category": "stakeholder_management"}
        ]
    }
    
    return questions.get(role, questions["Software Engineer"])

def get_sample_response(question, role):
    """Get sample response based on question and role"""
    responses = {
        "Software Engineer": [
            "A stack is a LIFO data structure where elements are added and removed from the top, while a queue is FIFO where elements are added at the rear and removed from the front. I've used stacks for implementing undo functionality and queues for task scheduling.",
            "I would implement a hash table using an array of linked lists to handle collisions. The hash function would map keys to array indices, and I'd use chaining for collision resolution. This provides O(1) average case for insertions and lookups.",
            "Binary search has O(log n) time complexity because it divides the search space in half with each iteration. It requires the data to be sorted and is much more efficient than linear search for large datasets.",
            "Dependency injection is a design pattern where dependencies are provided to a class rather than created within it. This improves testability, modularity, and flexibility. I've used it extensively with frameworks like Spring and Angular.",
            "I use garbage collection for managed languages and implement RAII patterns for C++. I also monitor memory usage with profiling tools and implement proper resource cleanup in destructors."
        ],
        "Data Scientist": [
            "I'm most familiar with supervised learning algorithms like Random Forest, XGBoost, and neural networks. I also work with unsupervised methods like K-means clustering and dimensionality reduction techniques like PCA.",
            "I handle missing data by first understanding the pattern of missingness. For MCAR data, I might use mean/median imputation. For MAR data, I use more sophisticated methods like multiple imputation or model-based approaches.",
            "The bias-variance tradeoff describes the relationship between model complexity and generalization error. High bias models are too simple and underfit, while high variance models are too complex and overfit. The goal is to find the sweet spot.",
            "I use tools like Matplotlib, Seaborn, and Plotly for static visualizations, and Tableau for interactive dashboards. I also create custom visualizations using D3.js when needed for specific use cases.",
            "I use techniques like cross-validation, holdout sets, and bootstrapping. I also look at metrics beyond accuracy like precision, recall, F1-score, and ROC-AUC depending on the problem type."
        ],
        "Product Manager": [
            "I prioritize features using frameworks like RICE (Reach, Impact, Confidence, Effort) and MoSCoW (Must-have, Should-have, Could-have, Won't-have). I also consider business objectives, user needs, and technical constraints.",
            "I managed the launch of a mobile app feature that increased user engagement by 25%. I coordinated with engineering, design, marketing, and support teams, created launch materials, and monitored key metrics post-launch.",
            "I gather feedback through user interviews, surveys, analytics data, and support tickets. I analyze this data to identify patterns and prioritize improvements based on impact and feasibility.",
            "I track metrics like user acquisition, retention, engagement, conversion rates, and revenue. I also monitor leading indicators like feature adoption and user satisfaction scores.",
            "I use stakeholder mapping to understand different perspectives and priorities. I facilitate discussions to find common ground and make trade-offs transparent. Sometimes I need to escalate to leadership for final decisions."
        ]
    }
    
    role_responses = responses.get(role, responses["Software Engineer"])
    return {
        "answer": random.choice(role_responses),
        "duration": random.uniform(30, 120),  # 30 seconds to 2 minutes
        "confidence": random.uniform(0.7, 0.95)
    }

if __name__ == "__main__":
    add_sample_interview_data() 