import React, { useState, useEffect } from 'react'
import analytics, { 
  setConsent, 
  getConsent, 
  enableAnalytics, 
  disableAnalytics, 
  setContext, 
  clearContext 
} from './analytics'

function App() {
  const [user, setUser] = useState({ id: null, name: '', company: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [consentEnabled, setConsentEnabled] = useState(getConsent().analytics)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastEvent, setLastEvent] = useState('')

  // Track page view on component mount
  useEffect(() => {
    analytics.page({ 
      section: 'demo', 
      page_title: 'Analytics Demo Page',
      url: window.location.href 
    })
  }, [])

  // Demo data for items
  const products = [
    { id: 'prod_001', name: 'MacBook Pro', category: 'laptop' },
    { id: 'prod_002', name: 'iPhone 15', category: 'phone' },
    { id: 'prod_003', name: 'AirPods Pro', category: 'audio' }
  ]

  const content = [
    { id: 'article_001', name: 'System Design Basics', category: 'tutorial' },
    { id: 'article_002', name: 'React Best Practices', category: 'guide' },
    { id: 'article_003', name: 'Analytics Implementation', category: 'case-study' }
  ]

  // 1. User Context Management (Login/Logout)
  const handleLogin = () => {
    const mockUser = { 
      id: 'user_123', 
      name: 'Deepak Terse', 
      company: 'company_456' 
    }
    setUser(mockUser)
    setIsLoggedIn(true)
    
    // Set global context for analytics
    setContext({
      user_id: mockUser.id,
      company_id: mockUser.company,
      user_name: mockUser.name,
      session_start: new Date().toISOString()
    })
    
    analytics.track('UserLoggedIn', {
      user_id: mockUser.id,
      login_method: 'demo'
    })
    setLastEvent('UserLoggedIn - with global context set')
  }

  const handleLogout = () => {
    analytics.track('UserLoggedOut', {
      user_id: user.id,
      session_duration: Math.floor(Math.random() * 3600) // Random session duration for demo
    })
    
    setUser({ id: null, name: '', company: '' })
    setIsLoggedIn(false)
    
    // Clear global context
    clearContext()
    setLastEvent('UserLoggedOut - global context cleared')
  }

  // 2. Consent Management
  const toggleConsent = () => {
    if (consentEnabled) {
      disableAnalytics()
      setConsentEnabled(false)
      setLastEvent('Analytics disabled - events will be blocked')
    } else {
      enableAnalytics()
      setConsentEnabled(true)
      setLastEvent('Analytics enabled - events will be tracked')
    }
  }

  // 3. Custom Event Tracking with Sanitization Demo
  const handleCustomEvent = () => {
    analytics.track('CustomEventDemo', {
      event_source: 'demo_section',
      timestamp: new Date().toISOString(),
      sensitive_data: 'user@example.com', // This will be sanitized (removed)
      phone: '123-456-7890', // This will be sanitized (removed)
      email: 'test@test.com', // This will be sanitized (removed)
      password: 'secret123', // This will be sanitized (removed)
      safe_data: 'This data will be kept',
      button_clicked: 'custom_event_demo'
    })
    setLastEvent('CustomEventDemo - sensitive data (email, phone, password) sanitized')
  }

  // 4. Search Event Tracking
  const handleSearch = () => {
    if (searchTerm.trim()) {
      analytics.trackSearch('demo_search', searchTerm)
      setLastEvent(`Search tracked: "${searchTerm}" in demo_search feature`)
    }
  }

  // 5. Item Opened Event Tracking
  const handleItemClick = (item, type) => {
    analytics.trackItemOpened(`${type}_section`, item.id, item.name)
    setLastEvent(`ItemOpened tracked: ${item.name} (ID: ${item.id}) in ${type}_section`)
  }

  // 6. Page Event Tracking
  const handlePageEvent = () => {
    analytics.page({ 
      section: 'demo_page_refresh', 
      user_action: 'manual_page_track',
      timestamp: new Date().toISOString()
    })
    setLastEvent('Page event tracked with custom data')
  }

  const sectionStyle = {
    background: '#f9f9f9',
    padding: '20px',
    margin: '16px 0',
    borderRadius: '8px',
    border: '1px solid #ddd'
  }

  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px 8px 4px 0',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 Analytics Framework Demo</h1>
      <p>This single-page demo showcases all analytics capabilities. Open your browser's developer tools to see the analytics events being fired.</p>
      
      {/* Status Display */}
      <div style={{ 
        background: consentEnabled ? '#e8f5e8' : '#ffe8e8', 
        padding: '12px', 
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>Analytics Status:</strong> {consentEnabled ? '✅ Enabled' : '❌ Disabled'} | 
        <strong> User:</strong> {isLoggedIn ? `${user.name} (${user.id})` : 'Not logged in'} |
        <strong> Last Event:</strong> {lastEvent || 'None'}
      </div>

      {/* 1. Consent Management */}
      <div style={sectionStyle}>
        <h3>1. 🔐 Consent Management</h3>
        <p>Control whether analytics events are tracked or blocked.</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={consentEnabled}
            onChange={toggleConsent}
          />
          Enable Analytics Tracking
        </label>
        <small style={{ color: '#666' }}>
          When disabled, all analytics calls are blocked at the client level.
        </small>
      </div>

      {/* 2. User Context Management */}
      <div style={sectionStyle}>
        <h3>2. 👤 Global Context Management</h3>
        <p>Set global context (user ID, company ID) that gets automatically added to all events.</p>
        {!isLoggedIn ? (
          <button onClick={handleLogin} style={buttonStyle}>
            Login as Demo User
          </button>
        ) : (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Current Context:</strong> User ID: {user.id}, Company ID: {user.company}, Name: {user.name}
            </div>
            <button onClick={handleLogout} style={buttonStyle}>
              Logout (Clear Context)
            </button>
          </div>
        )}
        <br />
        <small style={{ color: '#666' }}>
          Global context is automatically merged into all tracked events.
        </small>
      </div>

      {/* 3. Custom Event Tracking with Sanitization */}
      <div style={sectionStyle}>
        <h3>3. 🧹 Event Sanitization Demo</h3>
        <p>Track custom events while automatically sanitizing sensitive data (email, phone, password, etc.)</p>
        <button onClick={handleCustomEvent} style={buttonStyle}>
          Fire Custom Event (with sensitive data)
        </button>
        <br />
        <small style={{ color: '#666' }}>
          Event includes sensitive fields (email, phone, password) that will be automatically removed.
        </small>
      </div>

      {/* 4. Search Tracking */}
      <div style={sectionStyle}>
        <h3>4. 🔍 Search Event Tracking</h3>
        <p>Track search queries with the dedicated search tracking method.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Enter search term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
          />
          <button 
            onClick={handleSearch} 
            style={searchTerm.trim() ? buttonStyle : disabledButtonStyle}
            disabled={!searchTerm.trim()}
          >
            Track Search
          </button>
        </div>
        <small style={{ color: '#666' }}>
          Uses trackSearch() method with feature name and search term.
        </small>
      </div>

      {/* 5. Item Opened Tracking */}
      <div style={sectionStyle}>
        <h3>5. 📦 Item Opened Event Tracking</h3>
        <p>Track when users open/click on specific items with ID and name.</p>
        
        <div style={{ marginBottom: '16px' }}>
          <h4>Products:</h4>
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => handleItemClick(product, 'product')}
              style={buttonStyle}
            >
              {product.name}
            </button>
          ))}
        </div>

        <div>
          <h4>Content:</h4>
          {content.map(item => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item, 'content')}
              style={buttonStyle}
            >
              {item.name}
            </button>
          ))}
        </div>
        <br />
        <small style={{ color: '#666' }}>
          Uses trackItemOpened() method with feature, ID, and name parameters.
        </small>
      </div>

      {/* 6. Page Event Tracking */}
      <div style={sectionStyle}>
        <h3>6. 📄 Page Event Tracking</h3>
        <p>Track page views and navigation events.</p>
        <button onClick={handlePageEvent} style={buttonStyle}>
          Track Page Event
        </button>
        <br />
        <small style={{ color: '#666' }}>
          Uses page() method to track page views with custom data. Page view was automatically tracked on component mount.
        </small>
      </div>

      {/* Instructions */}
      <div style={{
        background: '#e3f2fd',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #2196f3',
        marginTop: '24px'
      }}>
        <h3>📋 How to Test:</h3>
        <ol>
          <li>Open browser developer tools (F12) and go to Console/Network tab</li>
          <li>Try disabling/enabling analytics consent - notice events are blocked when disabled</li>
          <li>Login to see global context being set and added to all subsequent events</li>
          <li>Fire custom events and see how sensitive data is sanitized</li>
          <li>Test search and item tracking with different inputs</li>
          <li>Check the network tab to see actual API calls to your analytics service</li>
        </ol>
      </div>
    </div>
  )
}

export default App
