# TrustCareConnect Troubleshooting Guide

This guide helps diagnose and resolve common issues with the TrustCareConnect healthcare platform.

## Quick Diagnostics

### System Health Check

Run the automated health check to quickly identify issues:

```bash
# Run comprehensive health check
./monitoring/health-checks.sh

# Check individual services
curl https://api.trustcareconnect.com/api/health
curl https://trustcareconnect.com
dfx canister --network ic call backend healthCheck
```

### Log Analysis

```bash
# Check AI Proxy logs
cd packages/ai-proxy
tail -f logs/error.log

# Check application logs
tail -f logs/combined.log | grep ERROR

# Check system logs (if on VPS)
sudo journalctl -u trustcareconnect-ai-proxy -f
```

## Common Issues

### 1. Frontend Issues

#### Issue: Application Not Loading

**Symptoms:**
- Blank page or loading spinner
- Console errors in browser
- Network request failures

**Diagnosis:**
```bash
# Check browser console for errors
# Open Developer Tools -> Console

# Verify environment variables
cd packages/frontend
cat .env.local

# Check if backend canister is accessible
curl https://your-canister-id.icp0.io
```

**Solutions:**

1. **Environment Configuration:**
```bash
# Update canister ID
export REACT_APP_BACKEND_CANISTER_ID=$(dfx canister id backend)
echo "REACT_APP_BACKEND_CANISTER_ID=$REACT_APP_BACKEND_CANISTER_ID" >> .env.local

# Rebuild and restart
npm run build
npm start
```

2. **Clear Browser Cache:**
```bash
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
# Or clear browser cache completely
```

3. **Network Issues:**
```bash
# Check if API is accessible
curl -I https://api.trustcareconnect.com/api/health

# Verify CORS configuration
curl -X OPTIONS -H "Origin: https://trustcareconnect.com" \
     -H "Access-Control-Request-Method: POST" \
     https://api.trustcareconnect.com/api/query
```

#### Issue: Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Module resolution errors

**Diagnosis:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check for dependency issues
npm ls
npm audit
```

**Solutions:**

1. **Dependency Issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

2. **TypeScript Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix common type issues
# Update type definitions
npm update @types/react @types/node
```

3. **Memory Issues:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

### 2. AI Proxy Issues

#### Issue: AI Queries Failing

**Symptoms:**
- "AI provider error" messages
- Slow response times
- 500 internal server errors

**Diagnosis:**
```bash
# Check AI Proxy logs
cd packages/ai-proxy
tail -f logs/error.log

# Test API endpoints
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"queryText":"test query","provider":"openai"}'

# Check environment variables
echo $OPENAI_API_KEY | wc -c  # Should be > 10
echo $CLAUDE_API_KEY | wc -c  # Should be > 10
```

**Solutions:**

1. **API Key Issues:**
```bash
# Verify API keys are valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -20

# Update API keys
export OPENAI_API_KEY="your-new-key"
export CLAUDE_API_KEY="your-new-key"

# Restart service
npm restart
```

2. **Rate Limiting:**
```bash
# Check API usage
curl -I -X POST https://api.openai.com/v1/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Look for X-RateLimit headers
# Implement exponential backoff if needed
```

3. **Provider Fallback:**
```bash
# Test fallback mechanism
curl -X POST http://localhost:3001/api/query/fallback \
  -H "Content-Type: application/json" \
  -d '{"queryText":"test","preferredProvider":"claude"}'
```

#### Issue: High Memory Usage

**Symptoms:**
- Service crashes with "out of memory"
- Slow response times
- System warnings

**Diagnosis:**
```bash
# Check memory usage
ps aux | grep node
free -h

# Monitor in real-time
top -p $(pgrep node)
```

**Solutions:**

1. **Optimize Memory Usage:**
```bash
# Restart with memory limits
node --max-old-space-size=512 src/app.js

# Or use Docker with memory limits
docker run --memory="512m" trustcareconnect/ai-proxy
```

2. **Clear Logs:**
```bash
# Rotate logs
cd logs
find . -name "*.log" -mtime +7 -delete

# Or configure log rotation in winston
```

### 3. ICP Backend Issues

#### Issue: Canister Not Responding

**Symptoms:**
- HTTP requests to canister fail
- DFX commands timeout
- "Canister not found" errors

**Diagnosis:**
```bash
# Check canister status
dfx canister --network ic status backend

# Verify canister ID
dfx canister --network ic id backend

# Check cycles balance
dfx wallet --network ic balance
```

**Solutions:**

1. **Cycles Issues:**
```bash
# Get free cycles from faucet
# Visit: https://faucet.dfinity.org/

# Or add cycles to canister
dfx canister --network ic deposit-cycles 2000000000000 backend
```

2. **Canister Stopped:**
```bash
# Start canister
dfx canister --network ic start backend

# If corrupted, reinstall
dfx deploy --network ic backend --mode reinstall
```

3. **Network Issues:**
```bash
# Try different boundary node
dfx canister --network ic call backend healthCheck \
  --boundary-node https://ic0.app
```

#### Issue: Memory Limit Exceeded

**Symptoms:**
- "Canister memory limit exceeded" errors
- Query execution failures
- Data storage issues

**Diagnosis:**
```bash
# Check memory usage
dfx canister --network ic status backend

# Look for memory statistics
dfx canister --network ic call backend getStats
```

**Solutions:**

1. **Optimize Data Storage:**
```motoko
// Review Motoko code for memory usage
// Use efficient data structures
// Implement data cleanup routines
```

2. **Upgrade Canister:**
```bash
# Deploy with more cycles for memory
dfx deploy --network ic backend --with-cycles 5000000000000
```

### 4. Deployment Issues

#### Issue: CI/CD Pipeline Failures

**Symptoms:**
- GitHub Actions workflows fail
- Deployment steps timeout
- Authentication errors

**Diagnosis:**
```bash
# Check workflow status
# Go to GitHub repository -> Actions tab

# Local testing
act -j deploy-backend  # Requires 'act' tool
```

**Solutions:**

1. **Secret Configuration:**
```bash
# Verify all required secrets are set in GitHub:
# - DFX_IDENTITY
# - OPENAI_API_KEY
# - CLAUDE_API_KEY
# - VERCEL_TOKEN
# - etc.
```

2. **Identity Issues:**
```bash
# Re-encode DFX identity
base64 -i identity.pem

# Update GitHub secret with new value
```

3. **Timeout Issues:**
```bash
# Increase timeout in workflow
timeout-minutes: 30  # In .github/workflows/*.yml
```

#### Issue: Docker Deployment Failures

**Symptoms:**
- Container exits immediately
- Port binding errors
- Image build failures

**Diagnosis:**
```bash
# Check Docker logs
docker logs trustcareconnect-ai-proxy

# Test image locally
docker run -it trustcareconnect/ai-proxy:latest /bin/sh
```

**Solutions:**

1. **Port Conflicts:**
```bash
# Check what's using port 3001
lsof -i :3001

# Kill conflicting process
sudo kill -9 $(lsof -t -i:3001)

# Or use different port
docker run -p 3002:3001 trustcareconnect/ai-proxy
```

2. **Environment Variables:**
```bash
# Pass environment variables to container
docker run -e OPENAI_API_KEY=$OPENAI_API_KEY \
           -e CLAUDE_API_KEY=$CLAUDE_API_KEY \
           trustcareconnect/ai-proxy
```

3. **Build Issues:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild image
docker build --no-cache -t trustcareconnect/ai-proxy .
```

### 5. Database and Storage Issues

#### Issue: Data Persistence Problems

**Symptoms:**
- Patient/doctor data lost after restart
- Queries not saving properly
- State rollbacks

**Diagnosis:**
```bash
# Check canister storage
dfx canister --network ic status backend

# Query recent data
dfx canister --network ic call backend getRecentQueries
```

**Solutions:**

1. **Backup and Restore:**
```bash
# Create data backup
dfx canister --network ic call backend exportData > backup.json

# Restore from backup
dfx canister --network ic call backend importData < backup.json
```

2. **Stable Storage:**
```motoko
// Ensure critical data uses stable variables
stable var patients : [(PatientId, Patient)] = [];
```

### 6. Performance Issues

#### Issue: Slow Response Times

**Symptoms:**
- API calls take > 5 seconds
- UI feels sluggish
- Timeouts in browser

**Diagnosis:**
```bash
# Measure API response times
curl -w "@curl-format.txt" -o /dev/null -s \
  https://api.trustcareconnect.com/api/health

# Check server load
top
htop
```

**Solutions:**

1. **Optimize AI Queries:**
```bash
# Reduce query size
# Implement caching
# Use faster AI models
```

2. **Add Caching:**
```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache responses for 1 hour
client.setex(queryKey, 3600, JSON.stringify(response));
```

3. **Database Optimization:**
```motoko
// Use efficient data structures
// Index frequently queried fields
// Implement pagination
```

## Monitoring and Alerting

### Real-time Monitoring

```bash
# Start monitoring dashboard
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana
open http://localhost:3000
```

### Set up Alerts

```bash
# Configure Slack notifications
export SLACK_WEBHOOK_URL="your-webhook-url"

# Test alerts
./monitoring/health-checks.sh
```

### Log Aggregation

```bash
# View aggregated logs in Grafana
# Go to Explore -> Select Loki -> Query: {job="ai-proxy"}

# Or use command line
docker exec -it trustcareconnect-loki \
  logcli query '{level="error"}' --limit=50
```

## Getting Help

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export NODE_ENV=development

# Restart services with verbose logging
npm run dev
```

### Community Support

1. **GitHub Issues**: [Report bugs and ask questions](https://github.com/musyokapatrickmutuku/trustcareconnect/issues)
2. **Documentation**: [Read full documentation](https://docs.trustcareconnect.com)
3. **Discord/Slack**: Join our community chat
4. **Email Support**: support@trustcareconnect.com

### Creating Bug Reports

Include this information when reporting issues:

```bash
# System information
uname -a
node --version
dfx --version
docker --version

# Service status
./monitoring/health-checks.sh

# Recent logs
tail -100 packages/ai-proxy/logs/error.log

# Configuration (remove sensitive data)
cat .env.local | sed 's/=.*/=***redacted***/'
```

### Professional Support

For enterprise deployments and critical issues:

- **Priority Support**: premium@trustcareconnect.com
- **Consulting**: Available for custom deployments
- **SLA Options**: 24/7 support with guaranteed response times

## Prevention

### Regular Maintenance

```bash
# Weekly maintenance script
#!/bin/bash
set -e

echo "Running weekly maintenance..."

# Update dependencies
cd packages/frontend && npm update
cd ../ai-proxy && npm update

# Clean up logs
find logs/ -name "*.log" -mtime +30 -delete

# Check canister health
dfx canister --network ic status backend

# Run health checks
./monitoring/health-checks.sh

echo "Maintenance complete!"
```

### Monitoring Best Practices

1. **Set up alerts** for critical metrics
2. **Monitor resource usage** regularly  
3. **Keep logs** for at least 30 days
4. **Test disaster recovery** procedures monthly
5. **Update dependencies** regularly
6. **Monitor API quotas** and usage

### Security Checklist

- [ ] API keys are rotated regularly
- [ ] Logs don't contain sensitive data
- [ ] HTTPS is enforced everywhere
- [ ] Rate limiting is properly configured
- [ ] Error messages don't expose internals
- [ ] Dependencies are kept up to date
- [ ] Monitoring is active and alerting works