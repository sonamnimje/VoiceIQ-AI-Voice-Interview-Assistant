#!/usr/bin/env python3
"""
Test API Endpoints
This script tests the new interview data storage API endpoints.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_interview_endpoints():
    """Test the interview API endpoints"""
    print("Testing interview API endpoints...")
    
    # Test 1: Create interview session
    print("\n1. Testing session creation...")
    session_data = {
        "userEmail": "test@example.com",
        "type": "technical",
        "role": "Software Engineer",
        "difficulty": "medium",
        "duration": 30
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/interview/create-session", json=session_data)
        if response.status_code == 200:
            session_response = response.json()
            session_id = session_response.get("sessionId")
            print(f"✓ Session created: {session_id}")
        else:
            print(f"✗ Session creation failed: {response.status_code}")
            return
    except Exception as e:
        print(f"✗ Session creation error: {e}")
        return
    
    # Test 2: Get questions
    print("\n2. Testing question generation...")
    question_data = {
        "mode": "tech",
        "role": "Software Engineer",
        "difficulty": "medium",
        "count": 3,
        "sessionId": session_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/interview-modes/questions", json=question_data)
        if response.status_code == 200:
            questions_response = response.json()
            questions = questions_response.get("questions", [])
            print(f"✓ Got {len(questions)} questions")
            for i, q in enumerate(questions):
                print(f"   {i+1}. {q.get('question', '')[:50]}...")
        else:
            print(f"✗ Question generation failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"✗ Question generation error: {e}")
    
    # Test 3: Submit response
    print("\n3. Testing response submission...")
    if questions:
        question = questions[0]
        response_data = {
            "sessionId": session_id,
            "questionId": question.get("id"),
            "questionIndex": 0,
            "question": question.get("question"),
            "answer": "This is a test response to demonstrate the API functionality.",
            "responseDuration": 45.5,
            "confidenceScore": 0.85
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/interview/response", json=response_data)
            if response.status_code == 200:
                response_response = response.json()
                print(f"✓ Response submitted: {response_response.get('message')}")
            else:
                print(f"✗ Response submission failed: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"✗ Response submission error: {e}")
    
    # Test 4: Get session data
    print("\n4. Testing session data retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/interview/session-data/{session_id}")
        if response.status_code == 200:
            session_data_response = response.json()
            summary = session_data_response.get("summary", {})
            print(f"✓ Session data retrieved:")
            print(f"   Questions: {summary.get('total_questions', 0)}")
            print(f"   Responses: {summary.get('total_responses', 0)}")
            print(f"   Has transcript: {summary.get('has_transcript', False)}")
            print(f"   Has feedback: {summary.get('has_feedback', False)}")
        else:
            print(f"✗ Session data retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Session data retrieval error: {e}")
    
    # Test 5: Export session data
    print("\n5. Testing data export...")
    try:
        response = requests.get(f"{BASE_URL}/api/interview/export/{session_id}")
        if response.status_code == 200:
            print(f"✓ Data export successful: {len(response.content)} bytes")
        else:
            print(f"✗ Data export failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Data export error: {e}")
    
    print("\n✅ API endpoint testing completed!")

if __name__ == "__main__":
    test_interview_endpoints() 