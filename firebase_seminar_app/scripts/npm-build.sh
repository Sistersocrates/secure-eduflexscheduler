#!/bin/bash
# Script to build the application in the correct directory

echo "🏗️ Building Firebase Seminar App..."
cd /home/project/firebase_seminar_app

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in firebase_seminar_app directory"
    exit 1
fi

echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build files are in the 'dist' directory"
else
    echo "❌ Build failed"
    exit 1
fi