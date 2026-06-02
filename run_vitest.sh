#!/bin/bash
cd /Volumes/Development/yyc3-77/YYC3-Portable-Intelligent-AI-System
./node_modules/.bin/vitest run --reporter=verbose > /tmp/vitest_result.txt 2>&1
echo "DONE: exit=$?"
