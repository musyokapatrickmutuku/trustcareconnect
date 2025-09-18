# TrustCareConnect Bridge Deployment Guide

## Overview

This guide covers the deployment automation system for the TrustCareConnect Bridge Service, including Docker containers, ICP canisters, and infrastructure management.

## Prerequisites

### Required Tools
- Docker and Docker Compose
- Node.js 18+ and npm
- DFX (DFINITY SDK)
- PM2 process manager
- Nginx web server
- PostgreSQL client tools
- Redis CLI tools
- curl and jq

### System Requirements
- Linux/macOS environment
- Minimum 8GB RAM, 20GB disk space
- Network access to ICP network and external APIs

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Set required variables:
# - Database credentials (DB_HOST, DB_USER, DB_PASSWORD)
# - API keys (NOVITA_API_KEY, JWT_SECRET)
# - ICP configuration (ICP_CANISTER_ID)
# - SSL certificates (SSL_CERT_PATH, SSL_KEY_PATH)
```

### 2. Deploy to Staging

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to staging environment
./deploy.sh staging

# Monitor deployment logs
tail -f /var/log/trustcare-deploy-*.log
```

### 3. Deploy to Production

```bash
# Deploy to production with specific version
./deploy.sh production v1.2.0

# Monitor service status
pm2 status
systemctl status nginx
```

## Deployment Features

### ✅ Comprehensive Automation
- **Environment Validation**: Validates all required environment variables and tools
- **Docker Image Building**: Multi-stage builds with security scanning
- **Health Checks**: Verifies all services are running correctly
- **Database Migrations**: Automatic schema updates with rollback support
- **ICP Canister Deployment**: Updates blockchain components with cycle management
- **PM2 Process Management**: Cluster mode with auto-restart and monitoring
- **Nginx Configuration**: SSL termination, load balancing, and security headers
- **Log Aggregation**: Centralized logging with Fluentd/Elasticsearch integration
- **Smoke Tests**: Validates deployment success across all components
- **Notifications**: Slack/email alerts for deployment status
- **Rollback Support**: Automatic rollback on deployment failure

### 🚀 Deployment Process

1. **Pre-Deployment**
   - Creates rollback point with current state backup
   - Validates environment and dependencies
   - Performs security scans on Docker images

2. **Build Phase**
   - Builds Docker images with version tags
   - Runs security scans with Trivy
   - Pushes images to container registry

3. **Database Phase**
   - Creates backup before migrations
   - Applies schema migrations sequentially
   - Validates migration success

4. **ICP Phase**
   - Deploys backend and frontend canisters
   - Updates API keys and configuration
   - Verifies canister functionality

5. **Service Phase**
   - Configures PM2 with cluster mode
   - Sets up Nginx with SSL and security headers
   - Configures log aggregation

6. **Validation Phase**
   - Performs comprehensive health checks
   - Runs smoke tests on all endpoints
   - Validates service integration

7. **Notification Phase**
   - Sends deployment success/failure notifications
   - Updates deployment tracking logs

## Configuration Files

### Service Health Check Configuration
```json
# config/services-production.json
{
  "services": [
    {
      "name": "Bridge Service",
      "health_url": "https://bridge.trustcareconnect.com/health",
      "max_attempts": 30,
      "wait_time": 10
    }
  ]
}
```

### PM2 Ecosystem Configuration
```javascript
// Generated automatically by deploy.sh
module.exports = {
  apps: [{
    name: 'trustcare-bridge',
    script: './src/bridge-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

## Advanced Usage

### Custom Deployment with Options

```bash
# Deploy with specific Docker registry
DOCKER_REGISTRY=your-registry.com ./deploy.sh production

# Deploy with rollback disabled
ROLLBACK_ENABLED=false ./deploy.sh staging

# Deploy with custom notification webhook
SLACK_WEBHOOK_URL=https://your-webhook ./deploy.sh production
```

### Manual Rollback

```bash
# If automatic rollback fails, manual rollback available
./deploy.sh rollback production

# Check rollback status
pm2 logs
systemctl status nginx
```

### Monitoring Deployment

```bash
# Watch deployment logs in real-time
tail -f /var/log/trustcare-deploy-$(date +%Y%m%d)*.log

# Check service health
curl https://bridge.trustcareconnect.com/health

# Monitor PM2 processes
pm2 monit

# Check Nginx status
sudo nginx -t
systemctl status nginx
```

## Security Features

### SSL/TLS Configuration
- Automatic SSL certificate management
- Strong cipher suites (TLS 1.2+)
- HSTS headers for security
- Perfect Forward Secrecy

### Security Headers
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options SAMEORIGIN always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
```

### Rate Limiting
- API endpoints: 10 req/s per IP
- WebSocket connections: 5 req/s per IP
- Medical queries: 10 per hour per patient

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```bash
   # Check required variables
   ./deploy.sh staging --validate-only
   ```

2. **Docker Build Failures**
   ```bash
   # Check Docker daemon
   docker info

   # Rebuild images manually
   docker build -t trustcare-bridge:test .
   ```

3. **Database Migration Errors**
   ```bash
   # Check database connectivity
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT version();"

   # View migration status
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM schema_migrations;"
   ```

4. **ICP Canister Deployment Issues**
   ```bash
   # Check DFX identity
   dfx identity whoami

   # Check canister status
   dfx canister status packages/backend --network ic

   # View canister logs
   dfx canister logs packages/backend
   ```

5. **SSL Certificate Issues**
   ```bash
   # Verify certificate validity
   openssl x509 -in $SSL_CERT_PATH -noout -dates

   # Test SSL configuration
   openssl s_client -connect bridge.trustcareconnect.com:443
   ```

### Log Locations

- **Deployment Logs**: `/var/log/trustcare-deploy-*.log`
- **Application Logs**: `/var/log/trustcare/*.log`
- **Nginx Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **PM2 Logs**: `pm2 logs` or `/home/user/.pm2/logs/`
- **System Logs**: `journalctl -u nginx`, `journalctl -u postgresql`

### Recovery Procedures

1. **Service Recovery**
   ```bash
   # Restart PM2 processes
   pm2 restart all

   # Reload Nginx configuration
   sudo systemctl reload nginx

   # Restart database connection
   sudo systemctl restart postgresql
   ```

2. **Complete System Recovery**
   ```bash
   # Full service restart
   sudo systemctl restart nginx
   pm2 restart all

   # Database connection reset
   sudo systemctl restart postgresql redis
   ```

## Best Practices

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] SSL certificates valid and accessible
- [ ] Database backup completed
- [ ] ICP canister cycles sufficient
- [ ] Monitoring systems operational
- [ ] Notification channels tested

### Post-Deployment Checklist
- [ ] All health checks passing
- [ ] Smoke tests successful
- [ ] Monitoring dashboards updated
- [ ] Error rates within normal ranges
- [ ] Performance metrics stable
- [ ] Security scans clean

### Maintenance Schedule
- **Daily**: Monitor health checks and error rates
- **Weekly**: Review security scan results
- **Monthly**: Update SSL certificates if needed
- **Quarterly**: Review and update dependencies

## Support

For deployment issues:
1. Check deployment logs: `/var/log/trustcare-deploy-*.log`
2. Review service health: `./deploy.sh health-check`
3. Contact DevOps team with deployment ID and error details
4. Reference troubleshooting section above

## Version History

- **v1.0.0**: Initial deployment automation
- **v1.1.0**: Added rollback functionality
- **v1.2.0**: Enhanced monitoring and notifications
- **v1.3.0**: Security improvements and compliance features