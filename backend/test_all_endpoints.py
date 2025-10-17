#!/usr/bin/env python3
"""
Comprehensive test script for VoiceIQ API endpoints
Tests all major endpoints with proper error handling
"""

import requests
import json
import time
import sys
from pathlib import Path

# Configuration
BASE_URL = "https://voiceiq-backend.onrender.com"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"
TEST_USERNAME = "testuser"

def test_endpoint(method, endpoint, data=None, expected_status=200, description=""):
    """Test a single endpoint and return results."""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=data, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=10)
        else:
            return False, f"Unsupported method: {method}"
        
        success = response.status_code == expected_status
        result = {
            "success": success,
            "status_code": response.status_code,
            "expected_status": expected_status,
            "response_time": response.elapsed.total_seconds(),
            "description": description
        }
        
        try:
            result["response_data"] = response.json()
        except:
            result["response_text"] = response.text[:200]
        
        return success, result
        
    except requests.exceptions.Timeout:
        return False, {"error": "Request timeout", "description": description}
    except requests.exceptions.ConnectionError:
        return False, {"error": "Connection error", "description": description}
    except Exception as e:
        return False, {"error": str(e), "description": description}

def run_all_tests():
    """Run all endpoint tests."""
    print("🧪 VoiceIQ API Endpoint Testing")
    print("=" * 50)
    
    tests = [
        # Basic connectivity
        ("GET", "/", None, 200, "Root endpoint"),
        
        # Authentication endpoints
        ("POST", "/signup", {
            "username": TEST_USERNAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }, 200, "User signup"),
        
        ("POST", "/login", {
            "userOrEmail": TEST_EMAIL,
            "password": TEST_PASSWORD
        }, 200, "User login"),
        
        # Profile endpoints
        ("GET", f"/api/profile", {"email": TEST_EMAIL}, 200, "Get user profile"),
        
        # Dashboard endpoints
        ("GET", f"/api/dashboard/stats/{TEST_EMAIL}", None, 200, "Dashboard stats"),
        ("GET", f"/api/interview/history/{TEST_EMAIL}?limit=5", None, 200, "Interview history"),
        
        # Interview modes
        ("GET", "/api/interview-modes", None, 200, "Interview modes"),
        
        # Resume upload (mock test)
        ("POST", "/api/resume/upload", {
            "resume": "mock_file_content",
            "config": json.dumps({
                "type": "standard",
                "role": "Software Engineer",
                "userEmail": TEST_EMAIL
            })
        }, 200, "Resume upload"),
    ]
    
    results = []
    passed = 0
    failed = 0
    
    for method, endpoint, data, expected_status, description in tests:
        print(f"\n🔍 Testing: {method} {endpoint}")
        print(f"   Description: {description}")
        
        success, result = test_endpoint(method, endpoint, data, expected_status, description)
        
        if success:
            print(f"   ✅ PASS - Status: {result['status_code']} - Time: {result['response_time']:.2f}s")
            passed += 1
        else:
            print(f"   ❌ FAIL - {result.get('error', 'Unknown error')}")
            failed += 1
        
        results.append({
            "endpoint": f"{method} {endpoint}",
            "description": description,
            "result": result
        })
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {passed} passed, {failed} failed")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed > 0:
        print("\n❌ Failed Tests:")
        for result in results:
            if not result["result"].get("success", False):
                print(f"   - {result['endpoint']}: {result['result'].get('error', 'Unknown error')}")
    
    return passed, failed, results

def test_database_health():
    """Test database-specific health checks."""
    print("\n🔍 Database Health Checks")
    print("-" * 30)
    
    try:
        # Test if we can get dashboard stats (indicates DB connectivity)
        response = requests.get(f"{BASE_URL}/api/dashboard/stats/{TEST_EMAIL}", timeout=10)
        
        if response.status_code == 200:
            print("✅ Database connectivity: OK")
            return True
        else:
            print(f"❌ Database connectivity: FAILED (Status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Database connectivity: ERROR - {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Starting VoiceIQ API Tests")
    print(f"🌐 Testing against: {BASE_URL}")
    print(f"📧 Test email: {TEST_EMAIL}")
    
    # Test basic connectivity first
    print("\n🔍 Basic Connectivity Test")
    success, result = test_endpoint("GET", "/", None, 200, "Root endpoint")
    
    if not success:
        print("❌ Cannot reach backend server. Please check if the service is running.")
        return False
    
    print("✅ Backend server is reachable")
    
    # Run all tests
    passed, failed, results = run_all_tests()
    
    # Test database health
    db_healthy = test_database_health()
    
    # Final summary
    print("\n" + "=" * 50)
    print("🎯 Final Results")
    print("=" * 50)
    print(f"✅ API Tests: {passed}/{passed+failed} passed")
    print(f"✅ Database: {'Healthy' if db_healthy else 'Issues detected'}")
    
    overall_success = (failed == 0) and db_healthy
    
    if overall_success:
        print("🎉 All tests passed! VoiceIQ is working correctly.")
    else:
        print("⚠️  Some issues detected. Check the logs above.")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
