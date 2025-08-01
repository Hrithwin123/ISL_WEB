#!/usr/bin/env python3
"""
Startup script for ISL Recognition System
This script starts the Flask ISL API and provides instructions for the Express backend
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import tensorflow
        import cv2
        import mediapipe
        import flask
        print("✅ All Python dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def start_flask_api():
    """Start the Flask ISL API"""
    print("🚀 Starting Flask ISL API...")
    try:
        # Start Flask API in a subprocess
        process = subprocess.Popen([
            sys.executable, "isl_api.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for the server to start
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ Flask ISL API is running on http://localhost:5001")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Failed to start Flask API: {stderr.decode()}")
            return None
    except Exception as e:
        print(f"❌ Error starting Flask API: {e}")
        return None

def main():
    print("=" * 60)
    print("🤟 ISL Recognition System - Server Startup")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check if model exists
    if not os.path.exists("isl_cnn_model.keras"):
        print("❌ Model file 'isl_cnn_model.keras' not found!")
        print("Please ensure your trained model is in the current directory.")
        sys.exit(1)
    
    print("✅ Model file found")
    
    # Start Flask API
    flask_process = start_flask_api()
    if not flask_process:
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("📋 Next Steps:")
    print("=" * 60)
    print("1. Install Express backend dependencies:")
    print("   cd isl-web/backend")
    print("   npm install")
    print()
    print("2. Set up environment variables:")
    print("   cp env.example .env")
    print("   # Edit .env with your MongoDB URI and JWT secret")
    print()
    print("3. Start Express backend:")
    print("   npm run dev")
    print()
    print("4. Start React frontend:")
    print("   cd ..")
    print("   npm install")
    print("   npm run dev")
    print()
    print("5. Access the application:")
    print("   Frontend: http://localhost:5173")
    print("   Express API: http://localhost:3000")
    print("   Flask ISL API: http://localhost:5001")
    print()
    print("Press Ctrl+C to stop the Flask API")
    
    try:
        # Keep the Flask API running
        flask_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Stopping Flask ISL API...")
        flask_process.terminate()
        print("✅ Flask ISL API stopped")

if __name__ == "__main__":
    main() 