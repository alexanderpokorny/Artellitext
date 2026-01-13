#!/bin/bash
# ===========================================
# Artellico - Build Script
# ===========================================
# Builds the application for production deployment.
#
# Usage:
#   ./scripts/build.sh [--check]
#
# Options:
#   --check   Run type checking before build

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🏗️  Artellico Production Build${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Parse arguments
RUN_CHECK=false
for arg in "$@"; do
    case $arg in
        --check)
            RUN_CHECK=true
            shift
            ;;
    esac
done

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Type checking (optional)
if [ "$RUN_CHECK" = true ]; then
    echo -e "${YELLOW}🔍 Running type checks...${NC}"
    npm run check
    echo -e "${GREEN}✓ Type checks passed${NC}"
    echo ""
fi

# Step 3: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 4: Show build output
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    echo -e "${BLUE}📊 Build Statistics:${NC}"
    echo -e "   Size: ${BUILD_SIZE}"
    echo -e "   Output: ./build/"
    echo ""
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Build successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy ./build/ to your server"
echo "  2. Set environment variables"
echo "  3. Run: node build/index.js"
echo ""
