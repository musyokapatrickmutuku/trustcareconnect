#!/bin/bash

# TrustCareConnect Health Check and Monitoring Script
# Monitors all production services and sends alerts

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_CANISTER_ID=${BACKEND_CANISTER_ID:-"your-backend-canister-id"}
AI_PROXY_URL=${AI_PROXY_URL:-"https://api.trustcareconnect.com"}
FRONTEND_URL=${FRONTEND_URL:-"https://trustcareconnect.com"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
ALERT_EMAIL=${ALERT_EMAIL:-""}

# Health check results
HEALTH_RESULTS=()
FAILED_SERVICES=()

echo -e "${BLUE}🏥 TrustCareConnect Health Check Monitor${NC}"
echo "======================================="
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# Check ICP backend canister health
check_backend_health() {
    echo -e "${YELLOW}🌐 Checking ICP Backend Canister...${NC}"
    
    local canister_url="https://${BACKEND_CANISTER_ID}.icp0.io"
    local status="FAIL"
    local response_time="N/A"
    local error_message=""
    
    # Test canister accessibility
    if timeout 30 curl -s -f "$canister_url" > /dev/null 2>&1; then
        status="PASS"
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$canister_url")
    else
        error_message="Canister not accessible"
        FAILED_SERVICES+=("Backend Canister")
    fi
    
    # Test specific health endpoint if available
    if [ "$status" = "PASS" ]; then
        if timeout 15 dfx canister --network ic call backend healthCheck 2>/dev/null | grep -q "ok"; then
            echo -e "${GREEN}  ✅ Health check: PASS${NC}"
        else
            status="WARN"
            error_message="Health check method failed"
            echo -e "${YELLOW}  ⚠️  Health check: WARN${NC}"
        fi
    fi
    
    HEALTH_RESULTS+=("Backend|$status|${response_time}s|$error_message")
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}  ✅ Backend Canister: HEALTHY (${response_time}s)${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}  ⚠️  Backend Canister: WARNING${NC}"
    else
        echo -e "${RED}  ❌ Backend Canister: FAILED - $error_message${NC}"
    fi
}

# Check AI proxy service health
check_ai_proxy_health() {
    echo -e "${YELLOW}🤖 Checking AI Proxy Service...${NC}"
    
    local status="FAIL"
    local response_time="N/A"
    local error_message=""
    
    # Test health endpoint
    local health_url="${AI_PROXY_URL}/api/health"
    if timeout 30 curl -s -f "$health_url" > /dev/null 2>&1; then
        status="PASS"
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$health_url")
        
        # Test API endpoint
        local test_response
        test_response=$(timeout 30 curl -s -X POST "${AI_PROXY_URL}/api/query" \
            -H "Content-Type: application/json" \
            -d '{"queryText":"health check","condition":"test","provider":"mock"}' 2>/dev/null || echo "")
        
        if echo "$test_response" | grep -q "success\|response"; then
            echo -e "${GREEN}  ✅ API endpoint: PASS${NC}"
        else
            status="WARN"
            error_message="API endpoint not responding correctly"
            echo -e "${YELLOW}  ⚠️  API endpoint: WARN${NC}"
        fi
    else
        error_message="Service not accessible"
        FAILED_SERVICES+=("AI Proxy")
    fi
    
    HEALTH_RESULTS+=("AI_Proxy|$status|${response_time}s|$error_message")
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}  ✅ AI Proxy: HEALTHY (${response_time}s)${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}  ⚠️  AI Proxy: WARNING${NC}"
    else
        echo -e "${RED}  ❌ AI Proxy: FAILED - $error_message${NC}"
    fi
}

# Check frontend application health
check_frontend_health() {
    echo -e "${YELLOW}🌟 Checking Frontend Application...${NC}"
    
    local status="FAIL"
    local response_time="N/A"
    local error_message=""
    
    # Test frontend accessibility
    if timeout 30 curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
        status="PASS"
        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$FRONTEND_URL")
        
        # Test if React app loads
        local page_content
        page_content=$(timeout 30 curl -s "$FRONTEND_URL" 2>/dev/null || echo "")
        
        if echo "$page_content" | grep -q -i "trustcareconnect\|react"; then
            echo -e "${GREEN}  ✅ React app: PASS${NC}"
        else
            status="WARN"
            error_message="React app may not be loading correctly"
            echo -e "${YELLOW}  ⚠️  React app: WARN${NC}"
        fi
    else
        error_message="Frontend not accessible"
        FAILED_SERVICES+=("Frontend")
    fi
    
    HEALTH_RESULTS+=("Frontend|$status|${response_time}s|$error_message")
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}  ✅ Frontend: HEALTHY (${response_time}s)${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}  ⚠️  Frontend: WARNING${NC}"
    else
        echo -e "${RED}  ❌ Frontend: FAILED - $error_message${NC}"
    fi
}

# Check SSL certificates
check_ssl_certificates() {
    echo -e "${YELLOW}🔒 Checking SSL Certificates...${NC}"
    
    local urls=("$AI_PROXY_URL" "$FRONTEND_URL")
    
    for url in "${urls[@]}"; do
        if [ -n "$url" ] && [[ "$url" == https://* ]]; then
            local domain=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
            local days_until_expiry
            
            days_until_expiry=$(timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | \
                openssl x509 -noout -dates 2>/dev/null | \
                grep "notAfter" | \
                sed 's/notAfter=//' | \
                xargs -I {} date -d "{}" +%s 2>/dev/null || echo "0")
            
            if [ "$days_until_expiry" -gt 0 ]; then
                local current_time=$(date +%s)
                local days_left=$(( (days_until_expiry - current_time) / 86400 ))
                
                if [ "$days_left" -gt 30 ]; then
                    echo -e "${GREEN}  ✅ $domain: $days_left days until expiry${NC}"
                elif [ "$days_left" -gt 7 ]; then
                    echo -e "${YELLOW}  ⚠️  $domain: $days_left days until expiry${NC}"
                else
                    echo -e "${RED}  ❌ $domain: $days_left days until expiry - URGENT${NC}"
                    FAILED_SERVICES+=("SSL Certificate - $domain")
                fi
            else
                echo -e "${YELLOW}  ⚠️  $domain: Could not check certificate${NC}"
            fi
        fi
    done
}

# Send Slack notification
send_slack_notification() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        echo -e "${YELLOW}📱 Sending Slack notification...${NC}"
        
        local status="good"
        local message="All TrustCareConnect services are healthy ✅"
        
        if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
            status="danger"
            message="⚠️ TrustCareConnect service issues detected:\n$(printf '• %s\n' "${FAILED_SERVICES[@]}")"
        fi
        
        local payload=$(cat << EOF
{
  "attachments": [{
    "color": "$status",
    "title": "🏥 TrustCareConnect Health Check Report",
    "text": "$message",
    "fields": [
      {"title": "Timestamp", "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")", "short": true},
      {"title": "Environment", "value": "Production", "short": true},
      {"title": "Services Checked", "value": "${#HEALTH_RESULTS[@]}", "short": true},
      {"title": "Failed Services", "value": "${#FAILED_SERVICES[@]}", "short": true}
    ]
  }]
}
EOF
        )
        
        if curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Slack notification sent${NC}"
        else
            echo -e "${RED}  ❌ Failed to send Slack notification${NC}"
        fi
    fi
}

# Send email notification
send_email_notification() {
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo -e "${YELLOW}📧 Sending email notification...${NC}"
        
        local subject="TrustCareConnect Health Check Report"
        if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
            subject="🚨 TrustCareConnect Service Alert"
        fi
        
        local body="TrustCareConnect Health Check Report
Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

Services Status:
$(printf '%s\n' "${HEALTH_RESULTS[@]}" | column -t -s'|')

"
        
        if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
            body+="⚠️ Failed Services:
$(printf '• %s\n' "${FAILED_SERVICES[@]}")

Please investigate these issues immediately.
"
        else
            body+="✅ All services are healthy."
        fi
        
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
        echo -e "${GREEN}  ✅ Email notification sent${NC}"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="/tmp/trustcareconnect-health-$(date +%Y%m%d-%H%M%S).json"
    
    echo -e "${YELLOW}📊 Generating health report...${NC}"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "overall_status": "$([ ${#FAILED_SERVICES[@]} -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "services": {
EOF
    
    local first=true
    for result in "${HEALTH_RESULTS[@]}"; do
        IFS='|' read -r service status response_time error <<< "$result"
        
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        cat >> "$report_file" << EOF
    "$service": {
      "status": "$status",
      "response_time": "$response_time",
      "error": "$error"
    }
EOF
    done
    
    cat >> "$report_file" << EOF
  },
  "failed_services": [
$(printf '    "%s"' "${FAILED_SERVICES[@]}" | paste -sd ',' -)
  ]
}
EOF
    
    echo -e "${GREEN}  ✅ Health report generated: $report_file${NC}"
}

# Main health check execution
main() {
    check_backend_health
    echo ""
    check_ai_proxy_health
    echo ""
    check_frontend_health
    echo ""
    check_ssl_certificates
    echo ""
    
    # Summary
    echo -e "${BLUE}📋 Health Check Summary${NC}"
    echo "======================"
    
    if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All services are healthy!${NC}"
        echo "Total services checked: ${#HEALTH_RESULTS[@]}"
    else
        echo -e "${RED}❌ ${#FAILED_SERVICES[@]} service(s) have issues:${NC}"
        printf '  • %s\n' "${FAILED_SERVICES[@]}"
        echo ""
        echo "Total services checked: ${#HEALTH_RESULTS[@]}"
    fi
    
    # Send notifications
    echo ""
    send_slack_notification
    send_email_notification
    generate_health_report
    
    # Exit with error code if any services failed
    if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
        exit 1
    fi
}

# Handle errors
trap 'echo -e "${RED}❌ Health check script failed!${NC}"; exit 1' ERR

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "TrustCareConnect Health Check Monitor"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Environment Variables:"
    echo "  BACKEND_CANISTER_ID  - ICP backend canister ID"
    echo "  AI_PROXY_URL         - AI proxy service URL"
    echo "  FRONTEND_URL         - Frontend application URL"
    echo "  SLACK_WEBHOOK_URL    - Slack webhook for notifications"
    echo "  ALERT_EMAIL          - Email address for alerts"
    echo ""
    echo "Examples:"
    echo "  $0                   # Run health checks with default URLs"
    echo "  $0 --help           # Show this help message"
    exit 0
fi

# Run main health checks
main