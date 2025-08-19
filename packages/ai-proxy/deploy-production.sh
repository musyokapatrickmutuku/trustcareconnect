#!/bin/bash

# TrustCareConnect AI Proxy Production Deployment Script
# Supports Docker, AWS ECS, Google Cloud Run, and Railway

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TrustCareConnect AI Proxy Production Deployment${NC}"
echo "=================================================="

# Configuration
IMAGE_NAME="trustcareconnect/ai-proxy"
CONTAINER_NAME="trustcareconnect-ai-proxy"
PORT=3001

# Check deployment target
check_deployment_target() {
    echo -e "${YELLOW}📋 Checking deployment target...${NC}"
    
    if [ -z "$DEPLOYMENT_TARGET" ]; then
        echo -e "${YELLOW}⚠️  DEPLOYMENT_TARGET not set. Available options:${NC}"
        echo "   - docker (local Docker deployment)"
        echo "   - aws (AWS ECS deployment)"
        echo "   - gcp (Google Cloud Run deployment)"
        echo "   - railway (Railway.app deployment)"
        echo "   - render (Render.com deployment)"
        echo ""
        echo "Set DEPLOYMENT_TARGET environment variable and run again."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment target: $DEPLOYMENT_TARGET${NC}"
}

# Build Docker image
build_image() {
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    
    docker build -t $IMAGE_NAME:latest .
    docker tag $IMAGE_NAME:latest $IMAGE_NAME:$(date +%Y%m%d-%H%M%S)
    
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Deploy to Docker (local/VPS)
deploy_docker() {
    echo -e "${YELLOW}🐳 Deploying to Docker...${NC}"
    
    # Stop existing container
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:$PORT \
        -e NODE_ENV=production \
        -e OPENAI_API_KEY="${OPENAI_API_KEY}" \
        -e CLAUDE_API_KEY="${CLAUDE_API_KEY}" \
        -e CORS_ORIGINS="${CORS_ORIGINS:-https://trustcareconnect.com}" \
        $IMAGE_NAME:latest
    
    echo -e "${GREEN}✅ Deployed to Docker successfully${NC}"
    echo -e "${GREEN}🌐 Available at: http://localhost:$PORT${NC}"
}

# Deploy to AWS ECS
deploy_aws() {
    echo -e "${YELLOW}☁️  Deploying to AWS ECS...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
        exit 1
    fi
    
    # Tag and push to ECR
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=${AWS_REGION:-us-east-1}
    ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Create repository if it doesn't exist
    aws ecr describe-repositories --repository-names $IMAGE_NAME --region $AWS_REGION || \
        aws ecr create-repository --repository-name $IMAGE_NAME --region $AWS_REGION
    
    # Tag and push
    docker tag $IMAGE_NAME:latest $ECR_URI:latest
    docker push $ECR_URI:latest
    
    echo -e "${GREEN}✅ Image pushed to ECR${NC}"
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Create ECS cluster if not exists"
    echo "2. Create task definition with image: $ECR_URI:latest"
    echo "3. Create ECS service"
    echo "4. Set up Application Load Balancer"
}

# Deploy to Google Cloud Run
deploy_gcp() {
    echo -e "${YELLOW}☁️  Deploying to Google Cloud Run...${NC}"
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK first.${NC}"
        exit 1
    fi
    
    PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project)}
    REGION=${GCP_REGION:-us-central1}
    
    # Configure Docker for GCP
    gcloud auth configure-docker
    
    # Tag and push to Google Container Registry
    GCR_URI="gcr.io/$PROJECT_ID/$IMAGE_NAME"
    docker tag $IMAGE_NAME:latest $GCR_URI:latest
    docker push $GCR_URI:latest
    
    # Deploy to Cloud Run
    gcloud run deploy trustcareconnect-ai-proxy \
        --image=$GCR_URI:latest \
        --platform=managed \
        --region=$REGION \
        --allow-unauthenticated \
        --port=$PORT \
        --set-env-vars="NODE_ENV=production" \
        --set-env-vars="OPENAI_API_KEY=${OPENAI_API_KEY}" \
        --set-env-vars="CLAUDE_API_KEY=${CLAUDE_API_KEY}" \
        --memory=512Mi \
        --cpu=1 \
        --max-instances=10
    
    SERVICE_URL=$(gcloud run services describe trustcareconnect-ai-proxy --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}✅ Deployed to Google Cloud Run${NC}"
    echo -e "${GREEN}🌐 Available at: $SERVICE_URL${NC}"
}

# Deploy to Railway
deploy_railway() {
    echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
    
    if [ ! -f "railway.json" ]; then
        cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node src/app.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 10,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF
    fi
    
    echo -e "${GREEN}✅ Railway configuration created${NC}"
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Install Railway CLI: npm install -g @railway/cli"
    echo "2. Login: railway login"
    echo "3. Initialize: railway init"
    echo "4. Deploy: railway up"
    echo "5. Set environment variables in Railway dashboard"
}

# Deploy to Render
deploy_render() {
    echo -e "${YELLOW}🎨 Preparing Render deployment...${NC}"
    
    if [ ! -f "render.yaml" ]; then
        cat > render.yaml << EOF
services:
  - type: web
    name: trustcareconnect-ai-proxy
    env: docker
    dockerfilePath: ./Dockerfile
    plan: starter
    region: oregon
    buildCommand: ""
    startCommand: "node src/app.js"
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: OPENAI_API_KEY
        sync: false
      - key: CLAUDE_API_KEY
        sync: false
      - key: CORS_ORIGINS
        value: https://trustcareconnect.com
EOF
    fi
    
    echo -e "${GREEN}✅ Render configuration created${NC}"
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Push this repository to GitHub"
    echo "2. Connect GitHub repo to Render dashboard"
    echo "3. Set environment variables (OPENAI_API_KEY, CLAUDE_API_KEY)"
    echo "4. Deploy from Render dashboard"
}

# Test deployment
test_deployment() {
    echo -e "${YELLOW}🧪 Testing deployment...${NC}"
    
    local endpoint=""
    case $DEPLOYMENT_TARGET in
        docker)
            endpoint="http://localhost:$PORT"
            ;;
        *)
            echo -e "${YELLOW}⚠️  Manual testing required for $DEPLOYMENT_TARGET${NC}"
            return 0
            ;;
    esac
    
    if [ -n "$endpoint" ]; then
        # Wait for service to start
        sleep 10
        
        # Test health endpoint
        if curl -f "$endpoint/api/health" 2>/dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${RED}❌ Health check failed${NC}"
            return 1
        fi
        
        # Test API endpoint
        if curl -f -X POST "$endpoint/api/query" \
            -H "Content-Type: application/json" \
            -d '{"queryText":"test","condition":"test","provider":"mock"}' 2>/dev/null; then
            echo -e "${GREEN}✅ API test passed${NC}"
        else
            echo -e "${RED}❌ API test failed${NC}"
            return 1
        fi
    fi
}

# Main deployment function
main() {
    check_deployment_target
    build_image
    
    case $DEPLOYMENT_TARGET in
        docker)
            deploy_docker
            test_deployment
            ;;
        aws)
            deploy_aws
            ;;
        gcp)
            deploy_gcp
            ;;
        railway)
            deploy_railway
            ;;
        render)
            deploy_render
            ;;
        *)
            echo -e "${RED}❌ Unknown deployment target: $DEPLOYMENT_TARGET${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 AI Proxy deployment completed!${NC}"
}

# Handle errors
trap 'echo -e "${RED}❌ Deployment failed!${NC}"; exit 1' ERR

# Run main deployment
main