#!/bin/bash
# Quick wrapper script to run the comprehensive WSL startup test

echo "🚀 TrustCareConnect WSL Startup Test Launcher"
echo "=============================================="
echo

# Check if we're in WSL
if grep -q microsoft /proc/version 2>/dev/null; then
    echo "✓ Running in WSL environment"
else
    echo "⚠️  This script is optimized for WSL Ubuntu"
    echo "   It may work in other Linux environments but is not guaranteed"
fi

echo
echo "This will run a complete from-scratch test of TrustCareConnect:"
echo "• Install all prerequisites"
echo "• Clean and setup the project"
echo "• Deploy all services"
echo "• Run comprehensive tests"
echo

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting comprehensive test..."
    echo
    bash scripts/test/wsl-startup-test.sh
else
    echo "Test cancelled."
    exit 0
fi