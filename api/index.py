"""
Vercel Serverless Entrypoint (api/index.py)
--------------------------------------------
Purpose: Exports Flask 'app' WSGI entrypoint for Vercel Python Serverless Functions.
"""

import os
import sys

# Add project root directory to Python path for cross-directory imports
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Initialize database tables and seed default users/devices
try:
    from database.db_manager import ensure_db_initialized
    ensure_db_initialized()
except Exception as e:
    print(f"Vercel Serverless Init DB Warning: {e}")

from backend.app import app
