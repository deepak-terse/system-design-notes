# Analytics Demo with Plausible

## Overview

This project demonstrates comprehensive event tracking integration with **Plausible Analytics** using a self-hosted instance. The demo showcases two implementation approaches:

- **🏷️ Script Tag Integration** (commented in `index.html`): Direct Plausible script integration for automatic pageview tracking
- **🔧 SDK Wrapper Integration** (active): Custom analytics wrapper using the `analytics` library with `analytics-plugin-plausible` for flexible, vendor-agnostic event tracking

The demo includes a React application with interactive examples of:
- User authentication tracking
- Custom event tracking  
- Search event tracking
- Item interaction tracking
- Consent management
- Context enrichment

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│  Analytics SDK   │───▶│  Plausible API  │
│   (Frontend)    │    │   (Wrapper)      │    │  (Self-hosted)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   PostgreSQL +   │
                       │   ClickHouse     │
                       │   (Storage)      │
                       └──────────────────┘
```

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Docker** and **Docker Compose**

## Quick Start

### 1. Start the Plausible Analytics Backend

```bash
# Start all services (Plausible, PostgreSQL, ClickHouse)
docker-compose up -d

# Check if all services are running
docker-compose ps
```

Services will be available at:
- **Plausible Dashboard**: [http://localhost:8000](http://localhost:8000)
- **ClickHouse**: [http://localhost:8123](http://localhost:8123)
- **PostgreSQL**: `localhost:5432`

### 2. Configure Your Site in Plausible

#### Option A: Via Web UI (Recommended)
1. Go to [http://localhost:8000](http://localhost:8000)
2. Create an admin account (first user becomes admin)
3. Add a new site with domain `localhost` (for development)

#### Option B: Direct Database Insert
```sql
-- Connect to PostgreSQL and insert site record
INSERT INTO sites (domain, inserted_at, updated_at) 
VALUES ('localhost', NOW(), NOW());
```

### 3. Install Dependencies and Start the Demo

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The demo app will be available at [http://localhost:3000](http://localhost:3000)

## Environment Configuration

The application uses environment variables defined in `.env`:

```properties
# Site domain for tracking
VITE_SITE_DOMAIN=localhost

# Plausible API endpoint  
VITE_ANALYTICS_API_HOST=http://localhost:8000

# Enable/disable tracking
VITE_IS_TRACKING_ENABLED=true
```

## Development vs Production Mode

### Development Mode (Default)
```bash
pnpm run dev
```
- Tracks events to `localhost` domain
- Accessible at [http://localhost:3000](http://localhost:3000)
- All events are tracked and visible in Plausible dashboard

### Production Simulation Mode
Some privacy-focused browsers block localhost tracking. To simulate production:

1. **Add host mapping**:
   ```bash
   echo "127.0.0.1  mytestsite.local" | sudo tee -a /etc/hosts
   ```

2. **Update environment**:
   ```properties
   VITE_SITE_DOMAIN=mytestsite.local
   VITE_ANALYTICS_API_HOST=http://mytestsite.local:8000
   ```

3. **Update Plausible site domain** to `mytestsite.local`

4. **Build and preview**:
   ```bash
   pnpm run build
   pnpm run preview
   ```

5. **Access at**: [http://mytestsite.local:3000](http://mytestsite.local:3000)

## Demo Features

The React application demonstrates various analytics tracking scenarios:

### 🔐 User Authentication
- **Login/Logout tracking**: Captures user sessions
- **Context enrichment**: Adds user data to all subsequent events

### 🔍 Search Tracking  
- **Search events**: Tracks search terms and features
- **Term sanitization**: Limits search term length for privacy

### 📱 Item Interaction
- **Product views**: Tracks product/content interactions  
- **Categorized tracking**: Includes item categories and metadata

### 🍪 Consent Management
- **Toggle analytics**: Enable/disable tracking dynamically
- **Persistent consent**: Respects user privacy preferences

### 📊 Custom Events
- **Button clicks**: Track specific user actions
- **Form submissions**: Monitor user engagement
- **Navigation events**: Track user journey

## Analytics SDK Usage

### Basic Implementation

```javascript
import analytics from './analytics'

// Track page view
analytics.page({ 
  section: 'demo',
  page_title: 'My Page' 
})

// Track custom event
analytics.track('Button Click', { 
  button_name: 'subscribe',
  location: 'header' 
})

// Track search
analytics.trackSearch('products', 'macbook pro')

// Track item interaction
analytics.trackItemOpened('products', 'prod_001', 'MacBook Pro')
```

### Consent Management

```javascript
import { setConsent, enableAnalytics, disableAnalytics } from './analytics'

// Enable tracking
enableAnalytics()

// Disable tracking
disableAnalytics()

// Check current consent
const consent = getConsent()
console.log(consent.analytics) // true/false
```

### Context Management

```javascript
import { setContext, clearContext } from './analytics'

// Set global context (added to all events)
setContext({ 
  user_id: 'user_123',
  subscription: 'premium' 
})

// Clear all context
clearContext()
```

## Resources

- [Plausible Analytics Documentation](https://docs.plausible.io/)
- [Analytics Library Documentation](https://github.com/DavidWells/analytics)
- [Plausible Plugin Documentation](https://github.com/DavidWells/analytics/tree/master/packages/analytics-plugin-plausible)

