"""
Vercel Serverless Function entrypoint for SignBridge AI REST API.
Exposes FastAPI application instance for Vercel Python runtime.
"""

import sys
import os

# Add backend and backend/app to Python search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app

# Vercel looks for the ASGI 'app' callable
handler = app
