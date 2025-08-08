#!/usr/bin/env python3
"""
Test script for feedback routes
"""

import requests
import json

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = "test@example.com"

def test_feedback_routes():
    """Test the feedback routes"""
    
    print("Testing Feedback Routes")
    print("=" * 40)
    
    # Test 1: Get interview history
    print("\n1. Testing /api/interview/history")
    try:
        response = requests.get(
            f"{BASE_URL}/api/interview/history",
            headers={"X-User-Email": TEST_EMAIL}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 2: Get practice history
    print("\n2. Testing /api/practice/history")
    try:
        response = requests.get(
            f"{BASE_URL}/api/practice/history",
            headers={"X-User-Email": TEST_EMAIL}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 3: Generate AI suggestions
    print("\n3. Testing /api/feedback/ai-suggestions")
    try:
        response = requests.post(
            f"{BASE_URL}/api/feedback/ai-suggestions",
            headers={
                "Content-Type": "application/json",
                "X-User-Email": TEST_EMAIL
            },
            json={
                "interviewHistory": [],
                "practiceHistory": [],
                "timeframe": "all"
            }
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test 4: Get feedback analytics
    print("\n4. Testing /api/feedback/analytics")
    try:
        response = requests.get(
            f"{BASE_URL}/api/feedback/analytics",
            headers={"X-User-Email": TEST_EMAIL}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_feedback_routes() 