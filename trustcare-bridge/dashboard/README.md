# TrustCareConnect Bridge - Monitoring Dashboard

## Overview

Real-time monitoring dashboard for the TrustCareConnect Bridge Service providing comprehensive insights into system performance, user activity, and operational metrics.

## Features

### 📊 **Real-Time Monitoring**

1. **WebSocket Connection Status**
   - Live connection status indicator
   - Active connection counter
   - Connection health monitoring

2. **Query Analytics**
   - Live query counter with sparkline visualization
   - Query rate per minute
   - Query distribution over time

3. **Safety Score Distribution**
   - Interactive doughnut chart using Chart.js
   - Color-coded safety categories (Safe/Moderate/High Risk)
   - Real-time score tracking

4. **Active User Monitoring**
   - Current active users count
   - Peak users tracking
   - User activity visualization

5. **API Performance**
   - Response time graph (last 100 requests)
   - P50, P95, P99 percentile tracking
   - Average response time monitoring

6. **Error Rate Monitoring**
   - Real-time error rate calculation
   - Error count tracking
   - Visual error rate indicators

7. **Doctor Review Queue**
   - Queue length monitoring
   - Average review time tracking
   - Pending reviews counter

8. **Cache Performance**
   - Cache hit ratio display
   - Cache hits/misses tracking
   - Performance optimization insights

9. **API Credits Monitoring**
   - Novita AI credits remaining
   - Daily usage tracking
   - Credit consumption alerts

10. **System Health**
    - Overall system status
    - Component health indicators (DB, Redis, API)
    - Uptime monitoring

## Technical Implementation

### 🛠 **Technologies Used**

- **HTML5** - Semantic structure
- **Tailwind CSS** - Responsive styling framework
- **Chart.js** - Interactive data visualization
- **Lucide Icons** - Modern icon set
- **WebSocket API** - Real-time communication
- **Vanilla JavaScript** - Dashboard functionality

### 📱 **Responsive Design**

- **Mobile-First** approach with Tailwind CSS
- **Breakpoint optimizations** for tablet and desktop
- **Touch-friendly** interface elements
- **Horizontal scrolling** for metric cards on mobile
- **Adaptive layouts** based on screen size

### ⚡ **Performance Features**

- **Auto-refresh** every 5 seconds (toggleable)
- **Efficient data updates** with minimal DOM manipulation
- **Chart animations** with smooth transitions
- **Lazy loading** for non-critical elements
- **Memory optimization** for long-running sessions

## Usage

### 🚀 **Quick Start**

1. **Start the Bridge Service**
   ```bash
   cd trustcare-bridge
   npm run dev
   ```

2. **Access Dashboard**
   ```
   http://localhost:3001/dashboard
   ```

3. **Monitor Real-Time Metrics**
   - Dashboard auto-refreshes every 5 seconds
   - Toggle auto-refresh using the switch in header
   - Click metric cards for detailed views

### 📊 **Dashboard Layout**

```
┌─────────────────────────────────────────────────────────┐
│                     Header                              │
│  Logo | Title | Auto-refresh | Last Updated | Status   │
├─────────────────────────────────────────────────────────┤
│                 Status Cards Row                        │
│  WebSocket | Queries | Users | Errors                  │
├─────────────────────────────────────────────────────────┤
│                   Charts Row                           │
│  Safety Score Chart  |  API Response Time Chart        │
├─────────────────────────────────────────────────────────┤
│               Additional Metrics Row                    │
│  Review Queue | Cache | API Credits | System Health    │
└─────────────────────────────────────────────────────────┘
```

### 🎯 **Metric Cards**

Each metric card displays:
- **Primary Value** - Main metric (large text)
- **Secondary Info** - Additional context
- **Visual Indicator** - Progress bar or status indicator
- **Icon** - Visual representation of metric type
- **Hover Effects** - Enhanced visual feedback

### 📈 **Charts**

1. **Query Sparkline**
   - Shows query volume over last 20 minutes
   - Updates in real-time
   - Smooth line animation

2. **Safety Score Distribution**
   - Doughnut chart with three categories
   - Color-coded segments (Green/Yellow/Red)
   - Interactive tooltips

3. **API Response Time**
   - Line chart showing last 100 requests
   - Time-based x-axis
   - Hover details for specific points

## Configuration

### 🔧 **Environment Settings**

The dashboard automatically detects:
- **Bridge Service URL** - `ws://localhost:8080`
- **API Endpoint** - `/api/metrics`
- **Auto-refresh Interval** - 5 seconds

### 🎨 **Customization Options**

1. **Color Themes**
   ```css
   /* Custom color scheme */
   :root {
     --primary-color: #3b82f6;
     --success-color: #10b981;
     --warning-color: #f59e0b;
     --error-color: #ef4444;
   }
   ```

2. **Chart Configuration**
   ```javascript
   // Modify chart options in dashboard.js
   const chartOptions = {
     responsive: true,
     maintainAspectRatio: false,
     animation: { duration: 800 }
   };
   ```

3. **Refresh Interval**
   ```javascript
   // Change auto-refresh interval (milliseconds)
   const REFRESH_INTERVAL = 5000; // 5 seconds
   ```

## API Integration

### 📡 **WebSocket Events**

The dashboard listens for:

```javascript
// Real-time metric updates
{
  "type": "metrics",
  "payload": {
    "queryCount": 1250,
    "activeUsers": 42,
    "errorRate": 1.2,
    "responseTime": 245,
    "reviewQueue": 3,
    "cacheHitRatio": 87.5,
    "apiCredits": 8750
  }
}

// Individual query events
{
  "type": "query",
  "payload": {
    "safetyScore": 85,
    "urgency": "LOW",
    "responseTime": 320
  }
}

// Error events
{
  "type": "error",
  "payload": {
    "message": "API timeout",
    "code": "TIMEOUT"
  }
}
```

### 🔗 **REST API Endpoints**

Dashboard fetches data from:

```bash
# System metrics
GET /api/metrics

# Health check
GET /health

# Raw metrics (Prometheus format)
GET /metrics

# Application logs
GET /logs
```

## Mobile Experience

### 📱 **Mobile Optimizations**

- **Responsive Grid** - Stacks cards vertically on mobile
- **Touch Gestures** - Swipe to navigate metric cards
- **Optimized Charts** - Smaller, touch-friendly charts
- **Readable Text** - Appropriate font sizes for mobile
- **Fast Loading** - Optimized for mobile networks

### 📊 **Mobile Layout**

```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│   Status Card 1     │
├─────────────────────┤
│   Status Card 2     │
├─────────────────────┤
│   Charts (Stacked)  │
├─────────────────────┤
│   Additional Cards  │
└─────────────────────┘
```

## Troubleshooting

### 🐛 **Common Issues**

1. **Dashboard Not Loading**
   ```bash
   # Check bridge service is running
   curl http://localhost:3001/health

   # Verify dashboard files exist
   ls trustcare-bridge/dashboard/
   ```

2. **WebSocket Connection Failed**
   ```bash
   # Check WebSocket port
   netstat -an | grep 8080

   # Test WebSocket manually
   wscat -c ws://localhost:8080
   ```

3. **Charts Not Displaying**
   ```html
   <!-- Verify Chart.js is loaded -->
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```

4. **Metrics Not Updating**
   ```javascript
   // Check browser console for errors
   console.log('Dashboard loaded:', window.dashboard);
   ```

### 🔧 **Development Mode**

For development and testing:

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Simulate metrics
dashboard.simulateMetrics();

// Test connection status
dashboard.updateConnectionStatus('connected');
```

## Browser Support

### ✅ **Supported Browsers**

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### 📋 **Required Features**

- WebSocket support
- ES6 JavaScript
- CSS Grid and Flexbox
- Canvas API (for charts)

## Performance

### ⚡ **Optimization Features**

- **Lazy Chart Updates** - Only update visible charts
- **Debounced Resize** - Efficient window resize handling
- **Memory Management** - Cleanup old data points
- **Efficient DOM Updates** - Minimal reflows/repaints

### 📊 **Performance Metrics**

- **Initial Load** - < 2 seconds
- **Update Frequency** - 5 seconds (configurable)
- **Memory Usage** - < 50MB sustained
- **Chart Animations** - 60 FPS smooth

## Security

### 🔒 **Security Features**

- **CORS Protection** - Restricted origin access
- **No Sensitive Data** - Metrics only, no PII
- **Content Security Policy** - XSS protection
- **HTTPS Ready** - SSL/TLS support

## Contributing

### 🤝 **Development Guidelines**

1. **Code Style** - Follow existing patterns
2. **Responsive Design** - Test on multiple devices
3. **Performance** - Profile before/after changes
4. **Accessibility** - Include ARIA labels and keyboard navigation

### 📝 **Adding New Metrics**

1. **Update HTML Structure**
   ```html
   <div class="metric-card">
     <!-- New metric card -->
   </div>
   ```

2. **Add JavaScript Handler**
   ```javascript
   updateNewMetric(value) {
     document.getElementById('newMetric').textContent = value;
   }
   ```

3. **Include in Data Flow**
   ```javascript
   handleWebSocketMessage(data) {
     if (data.newMetric !== undefined) {
       this.updateNewMetric(data.newMetric);
     }
   }
   ```

---

**Happy monitoring!** 📊 Keep your TrustCareConnect Bridge Service running smoothly with real-time insights.