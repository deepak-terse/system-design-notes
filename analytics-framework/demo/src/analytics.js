import Analytics from 'analytics'
import plausiblePlugin from 'analytics-plugin-plausible'

const isBrowser = typeof window !== 'undefined'

// Environment configuration
const analyticsEnv = {
  enabled: import.meta.env.VITE_IS_TRACKING_ENABLED === 'true',
  siteDomain: import.meta.env.VITE_SITE_DOMAIN,
  apiHost: import.meta.env.VITE_ANALYTICS_API_HOST
}

// Consent API
let consent = { analytics: true }
export const setConsent = next => {
  consent = next || { analytics: false }
}
export const getConsent = () => consent
export const enableAnalytics = () => {
  consent.analytics = true
}
export const disableAnalytics = () => {
  consent.analytics = false
}

// Context API
let globalContext = {}
export const setContext = (ctx = {}) => {
  globalContext = { ...globalContext, ...ctx }
}
export const clearContext = () => {
  globalContext = {}
}

// Sanitize and Enrichment
const sanitize = (props = {}) => {
  const clone = { ...props }
  // Remove sensitive data
  delete clone.email
  delete clone.phone
  delete clone.password
  delete clone.ssn
  delete clone.credit_card
  delete clone.sensitive_data
  return clone
}
const enrich = (props = {}) => ({ ...globalContext, ...sanitize(props) })

// Safe wrapper (uses live consent)
const safe = fn => (...args) => {
  if (!consent.analytics) return
  try {
    return fn(...args)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[analytics]', e)
  }
}

/**
 * Creates an analytics client with tracking methods
 * @param {Object} [overrides={}] - Configuration overrides
 * @returns {{
 *   page: (data?: Object) => void,
 *   track: (name: string, props?: Object) => void,
 *   trackSearch: (feature: string, term: string) => void,
 *   trackItemOpened: (feature: string, id: string|number, name: string) => void
 * }} Analytics client instance
 */
export function createAnalyticsClient(overrides = {}) {
  const env = analyticsEnv || {}
  const enabled = overrides.enabled ?? env.enabled
  if (!enabled || !isBrowser) {
    const noop = () => {}
    return {
      /** @type {(data?: Object) => void} */
      page: noop,
      /** @type {(name: string, props?: Object) => void} */
      track: noop,
      /** @type {(feature: string, term: string) => void} */
      trackSearch: noop,
      /** @type {(feature: string, id: string|number, name: string) => void} */
      trackItemOpened: noop
    }
  }

  const domain = overrides.siteDomain ?? env.siteDomain ?? 'localhost'
  const host = overrides.apiHost ?? env.apiHost ?? 'http://localhost:8000'
  const extraPlugins = overrides.plugins ?? []

  const core = Analytics({
    plugins: [
      plausiblePlugin({ 
        domain, 
        apiHost: host,
        trackLocalhost: true 
      }),
      ...extraPlugins
    ]
  })

  return {
    /** @type {(data?: Object) => void} Track a page view */
    page: safe(data => core.page(enrich(data))),
    /** @type {(name: string, props?: Object) => void} Track a custom event */
    track: safe((name, props) => core.track(name, enrich(props))),
    /** @type {(feature: string, term: string) => void} Track a search event */
    trackSearch: safe((feature, term) => core.track('Search', enrich({ feature, label: String(term).slice(0, 256) }))),
    /** @type {(feature: string, id: string|number, name: string) => void} Track an item opened event */
    trackItemOpened: safe((feature, id, name) => core.track('ItemOpened', enrich({ feature, id: String(id), label: String(name).slice(0, 128) })))
  }
}

/**
 * Default analytics client instance
 * @type {{
 *   page: (data?: Object) => void,
 *   track: (name: string, props?: Object) => void,
 *   trackSearch: (feature: string, term: string) => void,
 *   trackItemOpened: (feature: string, id: string|number, name: string) => void
 * }}
 */
const analytics = createAnalyticsClient()

export default analytics