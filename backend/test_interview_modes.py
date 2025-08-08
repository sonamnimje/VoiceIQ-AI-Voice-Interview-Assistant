#!/usr/bin/env python3
"""
Test script for interview modes functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from interview_modes import InterviewModeManager, InterviewMode

def test_interview_modes():
    """Test the interview modes functionality"""
    print("🧪 Testing Interview Modes...")
    
    # Initialize the manager
    manager = InterviewModeManager()
    
    # Test 1: Check all modes are available
    print("\n1. Testing mode configurations...")
    for mode in InterviewMode:
        config = manager.get_mode_config(mode.value)
        print(f"   ✅ {mode.value}: {config.get('name', 'N/A')}")
        print(f"      Duration: {config.get('duration', 'N/A')} min")
        print(f"      Focus areas: {len(config.get('focus_areas', []))}")
    
    # Test 2: Test question generation for each mode
    print("\n2. Testing question generation...")
    roles = ["Software Engineer", "Data Scientist"]
    
    for mode in InterviewMode:
        print(f"\n   📝 Testing {mode.value} mode:")
        for role in roles:
            try:
                questions = manager.get_interview_questions(mode.value, role, "medium")
                print(f"      ✅ {role}: {len(questions)} questions generated")
                if questions:
                    print(f"         Sample: {questions[0]['question'][:60]}...")
            except Exception as e:
                print(f"      ❌ {role}: Error - {e}")
    
    # Test 3: Test evaluation functionality
    print("\n3. Testing evaluation functionality...")
    test_question = {
        "question": "Tell me about yourself and your background in software development.",
        "expected_keywords": ["experience", "projects", "technologies"],
        "type": "opening"
    }
    test_response = "I have 5 years of experience in software development, working on various projects using technologies like Python, JavaScript, and React."
    
    for mode in InterviewMode:
        try:
            evaluation = manager.evaluate_response(test_question, test_response, mode.value)
            print(f"   ✅ {mode.value}: Score {evaluation['score']}/100")
            print(f"      Keywords found: {evaluation['keywords_found']}")
        except Exception as e:
            print(f"   ❌ {mode.value}: Error - {e}")
    
    print("\n🎉 Interview modes test completed!")

if __name__ == "__main__":
    test_interview_modes() 