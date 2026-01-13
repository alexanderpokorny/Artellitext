#!/bin/bash
# ===========================================
# Artellico - Deploy Script
# ===========================================
# Deploys the application to a remote server via SSH.
#
# Usage:
#   ./scripts/deploy.sh <environment>
#
# Environments:
#   production    Deploy to production server
#   staging       Deploy to staging server
#
# Prerequisites:
#   - SSH access to the target server
#   - Server configured with Node.js 22+
#   - PM2 or systemd for process management
#
# Configuration:
#   Edit the variables below or set them as environment variables.

set -e

# ===========================================
# Configuration (customize these!)
# ===========================================

# Production server
PROD_HOST="${DEPLOY_PROD_HOST:-your-server.example.com}"
PROD_USER="${DEPLOY_PROD_USER:-artellico}"
PROD_PATH="${DEPLOY_PROD_PATH:-/var/www/artellico}"
PROD_PORT="${DEPLOY_PROD_PORT:-22}"

# Staging server (optional)
STAGING_HOST="${DEPLOY_STAGING_HOST:-staging.example.com}"
STAGING_USER="${DEPLOY_STAGING_USER:-artellico}"
STAGING_PATH="${DEPLOY_STAGING_PATH:-/var/www/artellico-staging}"
STAGING_PORT="${DEPLOY_STAGING_PORT:-22}"

# ===========================================
# Script Logic (don't modify below)
# ===========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No environment specified.${NC}"
    echo ""
    echo "Usage: ./scripts/deploy.sh <environment>"
    echo ""
    echo "Available environments:"
    echo "  production    Deploy to production server"
    echo "  staging       Deploy to staging server"
    exit 1
fi

ENV=$1

# Set variables based on environment
case $ENV in
    production|prod)
        HOST=$PROD_HOST
        USER=$PROD_USER
        DEPLOY_PATH=$PROD_PATH
        SSH_PORT=$PROD_PORT
        ENV_NAME="Production"
        ;;
    staging|stage)
        HOST=$STAGING_HOST
        USER=$STAGING_USER
        DEPLOY_PATH=$STAGING_PATH
        SSH_PORT=$STAGING_PORT
        ENV_NAME="Staging"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: $ENV${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 Artellico Deployment - ${ENV_NAME}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Target: ${USER}@${HOST}:${DEPLOY_PATH}"
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo -e "${YELLOW}⚠️  No build found. Building now...${NC}"
    ./scripts/build.sh
    echo ""
fi

# Check SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ! ssh -p "$SSH_PORT" -o ConnectTimeout=10 "${USER}@${HOST}" "echo 'Connection OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to ${HOST}${NC}"
    echo "Please check:"
    echo "  - SSH key is configured"
    echo "  - Server is reachable"
    echo "  - User has access"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection OK${NC}"
echo ""

# Create deployment timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${DEPLOY_PATH}/releases/${TIMESTAMP}"

echo -e "${YELLOW}📤 Deploying to ${HOST}...${NC}"

# Create release directory
ssh -p "$SSH_PORT" "${USER}@${HOST}" "mkdir -p ${RELEASE_DIR}"

# Upload build files
echo "  Uploading build files..."
rsync -avz --progress -e "ssh -p ${SSH_PORT}" \
    ./build/ \
    ./package.json \
    ./package-lock.json \
    "${USER}@${HOST}:${RELEASE_DIR}/"

# Install production dependencies on server
echo ""
echo -e "${YELLOW}📦 Installing dependencies on server...${NC}"
ssh -p "$SSH_PORT" "${USER}@${HOST}" "cd ${RELEASE_DIR} && npm ci --production"

# Update symlink to current release
echo ""
echo -e "${YELLOW}🔗 Updating current release symlink...${NC}"
ssh -p "$SSH_PORT" "${USER}@${HOST}" "ln -sfn ${RELEASE_DIR} ${DEPLOY_PATH}/current"

# Restart application
echo ""
echo -e "${YELLOW}🔄 Restarting application...${NC}"
ssh -p "$SSH_PORT" "${USER}@${HOST}" "cd ${DEPLOY_PATH}/current && pm2 restart artellico || pm2 start build/index.js --name artellico"

# Cleanup old releases (keep last 5)
echo ""
echo -e "${YELLOW}🧹 Cleaning up old releases...${NC}"
ssh -p "$SSH_PORT" "${USER}@${HOST}" "cd ${DEPLOY_PATH}/releases && ls -t | tail -n +6 | xargs -r rm -rf"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Deployment complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Deployed to: ${DEPLOY_PATH}/current"
echo "Release: ${TIMESTAMP}"
echo ""
