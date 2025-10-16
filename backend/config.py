import os
import sys
from pathlib import Path
from urllib.parse import urlparse


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

# Default SQLite database (local file)
DATABASE_FILENAME = "voiceiq.db"
DEFAULT_DATABASE_PATH = BACKEND_DIR / DATABASE_FILENAME


def parse_database_url(db_url: str):
    """
    Parse a DATABASE_URL (Postgres) and return components.
    This function intentionally only parses; SQLAlchemy/psycopg clients
    will consume full URL strings. We keep it lightweight here.
    """
    if not db_url:
        return None
    parsed = urlparse(db_url)
    return {
        'scheme': parsed.scheme,
        'username': parsed.username,
        'password': parsed.password,
        'host': parsed.hostname,
        'port': parsed.port,
        'path': parsed.path.lstrip('/') if parsed.path else None,
        'raw': db_url,
    }


# If a managed database is provided by the environment (Render/Heroku style), use it
_RAW_DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('DB_URL')
_PARSED = parse_database_url(_RAW_DATABASE_URL) if _RAW_DATABASE_URL else None

# Only treat DATABASE_URL as Postgres if scheme starts with 'postgres'
if _PARSED and _PARSED.get('scheme', '').startswith('postgres'):
    DATABASE_URL = _PARSED['raw']
    DATABASE_CONFIG = _PARSED
else:
    DATABASE_URL = None
    DATABASE_CONFIG = None


# If DATABASE_URL is not provided, fall back to local SQLite file
if DATABASE_CONFIG:
    # We expose DATABASE_PATH for backwards compatibility but keep the raw URL
    DATABASE_PATH = DATABASE_CONFIG['raw']
else:
    # Use filesystem path for SQLite
    DEFAULT_DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_PATH = str(DEFAULT_DATABASE_PATH)


# Friendly logging to help diagnose deployments
print("\n" + "=" * 50)
print("Application Configuration")
print("=" * 50)
print(f"Backend directory: {BACKEND_DIR}")
if DATABASE_CONFIG:
    print("Database type: Postgres (via DATABASE_URL)")
    print(f"Database URL: {DATABASE_CONFIG['raw']}")
else:
    print("Database type: SQLite (local file)")
    print(f"Database path: {DATABASE_PATH}")
    print(f"Database exists: {Path(DATABASE_PATH).exists()}")
    if not Path(DATABASE_PATH).exists():
        print("Database file will be created on first use")
print("=" * 50 + "\n")


__all__ = ['DATABASE_PATH', 'BACKEND_DIR', 'DATABASE_URL', 'DATABASE_CONFIG']
