#!/bin/bash
# Script to install npm dependencies in the correct directory

echo "🔧 Installing dependencies for Firebase Seminar App..."
cd /home/project/firebase_seminar_app

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in firebase_seminar_app directory"
    exit 1
fi

echo "📦 Running npm install..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi