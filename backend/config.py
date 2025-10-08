import os
import sys
from pathlib import Path

def get_backend_dir():
    """Get the absolute path to the backend directory."""
    # If running as a script
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        return Path(sys._MEIPASS)
    # Normal execution
    return Path(__file__).parent.absolute()

# Get the absolute path to the backend directory
BACKEND_DIR = get_backend_dir()

# Database configuration
DATABASE_FILENAME = "voiceiq.db"
DATABASE_PATH = BACKEND_DIR / DATABASE_FILENAME

# Ensure the directory exists
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

# Set the database path as an environment variable
os.environ['DB_PATH'] = str(DATABASE_PATH)

# Log database information
print("\n" + "="*50)
print("Application Configuration")
print("="*50)
print(f"Backend directory: {BACKEND_DIR}")
print(f"Database path: {DATABASE_PATH}")
print(f"Database exists: {DATABASE_PATH.exists()}")
if not DATABASE_PATH.exists():
    print("Database will be created on first use")
print("="*50 + "\n")

# Export the database path for other modules to use
__all__ = ['DATABASE_PATH', 'BACKEND_DIR']
