#!/bin/sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR"

# Store all child process PIDs
pids=""

# Cleanup function: gracefully shut down all services
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."

    # Send SIGTERM to all child processes
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            service_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "   Stopping process $pid ($service_name)..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done

    # Wait for all processes to exit (up to 5 seconds)
    sleep 1
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            # If still running, wait up to 4 more seconds
            timeout=4
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            # If still running, force kill
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Force killing process $pid..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
    done

    echo "✅ All services have been stopped"
    exit 0
}

echo "🚀 Starting all services..."
echo ""

# Switch to the build directory
cd "$BUILD_DIR" || exit 1

ls -lah

# Initialize database (if present)
if [ -d "./next-service-dist/db" ] && [ "$(ls -A ./next-service-dist/db 2>/dev/null)" ] && [ -d "/db" ]; then
    echo "🗄️  Initializing database from ./next-service-dist/db to /db..."
    cp -r ./next-service-dist/db/* /db/ 2>/dev/null || echo "  ⚠️  Failed to copy to /db, skipping database initialization"
    echo "✅ Database initialization completed"
fi

# Start the Next.js server
if [ -f "./next-service-dist/server.js" ]; then
    echo "🚀 Starting Next.js server..."
    cd next-service-dist/ || exit 1

    # Set environment variables
    export NODE_ENV=production
    export PORT=${PORT:-3000}
    export HOSTNAME=${HOSTNAME:-0.0.0.0}

    # Start Next.js in the background
    bun server.js &
    NEXT_PID=$!
    pids="$NEXT_PID"

    # Wait briefly to check if the process started successfully
    sleep 1
    if ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "❌ Failed to start Next.js server"
        exit 1
    else
        echo "✅ Next.js server started (PID: $NEXT_PID, Port: $PORT)"
    fi

    cd ../
else
    echo "⚠️  Next.js server file not found: ./next-service-dist/server.js"
fi

# Start mini-services
if [ -f "./mini-services-start.sh" ]; then
    echo "🚀 Starting mini-services..."

    # Run the start script (from root; the script handles mini-services-dist internally)
    sh ./mini-services-start.sh &
    MINI_PID=$!
    pids="$pids $MINI_PID"

    # Wait briefly to check if the process started successfully
    sleep 1
    if ! kill -0 "$MINI_PID" 2>/dev/null; then
        echo "⚠️  mini-services may have failed to start, but continuing..."
    else
        echo "✅ mini-services started (PID: $MINI_PID)"
    fi
elif [ -d "./mini-services-dist" ]; then
    echo "⚠️  mini-services directory exists, but start script not found"
else
    echo "ℹ️  mini-services directory does not exist, skipping"
fi

# Start Caddy (if Caddyfile exists)
echo "🚀 Starting Caddy..."

# Caddy runs as the foreground (main) process
echo "✅ Caddy started (running in foreground)"
echo ""
echo "🎉 All services are up and running!"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo ""

# Run Caddy as the main process
exec caddy run --config Caddyfile --adapter caddyfile
