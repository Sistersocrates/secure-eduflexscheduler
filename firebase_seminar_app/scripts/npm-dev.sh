#!/bin/bash
# Script to start development server in the correct directory

echo "🚀 Starting Firebase Seminar App development server..."
cd /home/project/firebase_seminar_app

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in firebase_seminar_app directory"
    exit 1
fi

echo "🔥 Starting development server..."
npm run dev