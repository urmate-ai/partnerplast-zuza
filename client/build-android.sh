#!/bin/bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$JAVA_HOME/bin:$PATH

echo "✅ Using Java 17: $(java -version 2>&1 | head -1)"
echo "🔧 Fixing permissions..."
cd android
sudo chown -R $(whoami) .gradle 2>/dev/null || true
sudo chown -R $(whoami) build 2>/dev/null || true
sudo chown -R $(whoami) app/build 2>/dev/null || true

echo "🚀 Starting Gradle build..."
./gradlew assembleRelease --no-daemon
