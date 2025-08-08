#!/usr/bin/env python3
"""
Quick script to run the database schema fix for the feedback table.
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fix_feedback_schema import fix_feedback_schema, test_feedback_functions

if __name__ == "__main__":
    print("🔧 Running feedback schema fix...")
    
    if fix_feedback_schema():
        print("\n✅ Schema fix completed!")
        
        if test_feedback_functions():
            print("\n🎉 All tests passed! The feedback system should now work correctly.")
            print("\n📝 Next steps:")
            print("1. Restart your backend server")
            print("2. Complete an interview to generate feedback data")
            print("3. Check the feedback page to see your interview data")
        else:
            print("\n⚠️  Schema fix completed but function tests failed.")
    else:
        print("\n❌ Schema fix failed!") 