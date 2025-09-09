# Analytics Collection Framework

## 1. Problem Statement
The platform currently lacks a unified framework for collecting and analyzing user behavior across modules and applications. This limits our ability to understand usage patterns, improve user experience, and make data-driven product decisions.

## 2. Objective
Design and implement a scalable analytics collection framework that allows all modules and custom applications to send usage analytics back to the platform.  

#### The framework should:  
- Be a core part of the application (always active).  
- Support future analytics and dashboarding needs.  
- Provide customers with reports on usage and feedback.  

#### Data to Collect:
- `companyId`, `userId`, `timestamp`, `app`, `eventCategory`, `eventAction`, `sessionInfo`, `context` (browser, OS, referrer, UTM parameters, device type, etc.).  

#### Events to Track:
- Page loads, clicks, searches, failed searches, content views, feature usage.  

## 3. Example Use Cases
- Track search terms and clicks to improve AI/ML search ranking.  
- Monitor OEM product subscriptions and procedure access frequency.  
- Identify most-viewed manuals, videos, help articles; collect feedback.  
- Log ticket activity and vehicle events for quality improvement.  
- Capture VIN-specific searches and content usage by trim.  
- Measure module adoption and post-release feature usage.  
- Track diagnostic flow usage, drop-offs, and recommendations followed.  
- Log failed searches and feedback to improve search algorithms.  

## 4. Solution Options

### Option A: Third-Party Tools
Examples: Google Analytics, Segment, Mixpanel  

- **Pros:** Fast setup, mature dashboards, reliable infrastructure.  
- **Cons:** Less control over schema, data ownership concerns, compliance issues, higher costs at scale.  
- **Best for:** Quick insights, prototypes, low engineering effort.  

### Option B: In-House Framework
Custom-built using open-source libraries.  

- **Pros:** Full control over schema, extensibility, compliance-friendly, future-proof.  
- **Cons:** Requires engineering investment and infrastructure setup.  
- **Best for:** Core analytics that must evolve with enterprise needs.  

### Option C: Open Source Ready-Made Alternatives
Examples: PostHog, Matomo, Plausible, Umami, Countly  

- **Pros:** Data ownership, customizable, cost-effective at scale.  
- **Cons:** Self-hosting, maintenance overhead, fewer integrations.  
- **Best for:** Extensible analytics with more control.  

---

### Open Source Tools Feature Comparison

| Feature / Criteria   | PostHog | Matomo | Plausible | Umami | Ackee | Countly | Trench |
|----------------------|---------|--------|-----------|-------|-------|---------|--------|
| **Features**         | Product analytics, funnels, session replay, feature flags, A/B testing | Pageviews, events, funnels, heatmaps, A/B testing | Lightweight tracking | Pageviews + basic event tracking | Privacy-friendly, GraphQL API | Multi-platform (web, mobile, desktop), push notifications, crash analytics | Ultra-fast ingestion/querying (Kafka + ClickHouse) |
| **Integration**      | JS/React SDK | Basic JS tracker | Simple script + API | Lightweight React | GraphQL API | Web SDK | Custom SDK |
| **Node.js Fit**      | Direct API | REST API | REST API | REST API | GraphQL API | REST API | REST/Streaming |
| **Storage Backend**  | ClickHouse/Postgres | MySQL/MariaDB/Postgres | Postgres | Postgres | MongoDB | MongoDB | ClickHouse |
| **Privacy**          | Good | Excellent | Excellent | Good | Excellent | Good | Good |
| **Scalability**      | Very high | High | Medium | Medium | Medium | High | Extreme |
| **Self-Hosting**     | Medium–High | Medium | Low | Low | Low–Medium | High | High |
| **Best Fit**         | Mixpanel alternative | Compliance-heavy | Minimal dashboards | Quick deploy | MongoDB devs | Multi-platform | High scale, low-latency |

---

## 5. Proposed Architecture

> This is based on my study on how GA and other modern analytic tools work. While Plausible covers much of our needs, this model serves as a reference for guiding future enhancements or integrations.

### Data Collection Layer
- **Client SDK:** Event tracking & user identification.  
- **Custom Plugins:** Extend with custom logic.  
- **Batch Events:** Queue + flush by size/interval (GA4: 20 events).  
- **Compression:** `gzip/deflate` in browser (`pako`), `zlib` in Node.js.  
- **PII Handling:** Redact/mask before sending.  
- **Async Delivery:**  
  - Retry failed batches via IndexedDB  
  - Use `requestIdleCallback` for idle scheduling  
  - Use `navigator.sendBeacon` on page unload  
- **Context Enrichment:** Auto-attach browser, OS, device type, referrer, UTM, session.  

### Streaming Events
- Streaming (Kafka/Kinesis) not required unless aiming for near real-time or very high throughput.  
- For SaaS: batching + compression + REST → SQS is enough.  

### Identity Management
Merge anonymous and authenticated events post-login.  

---

### Ingestion & Processing Layer
- **Queueing:** AWS SQS decouples ingestion from storage.  
- **Ingestion Service:** Validate schema, sanitize payloads, log errors.  
- **Dead Letter Queue:** Stores invalid events for debugging.  

---

### Storage Layer

**Raw Storage:**  
- Immutable source of truth, audit trail, advanced analytics.  
- Stored in S3, partitioned by year/month/day/hour.  
- Retention: 12–24 months.  
- Format: Compressed **Parquet** (5–10x smaller, 5–20x faster queries).  

**Aggregated Storage:**  
- PostgreSQL for smaller scale (core dimensions/metrics).  
- ClickHouse for >10M events/month.  
- Indexes: `(companyId, eventCategory, eventAction, timestamp)`.  

---

### Storage Schema

**Raw Storage (S3):**
```json
{
  "eventId": "evt_20250811_00001",
  "timestamp": "2025-08-11T10:15:30Z",
  "userId": "123",
  "companyId": "456",
  "sessionId": "789",
  "eventCategory": "product",
  "eventAction": "click",
  "eventLabel": "Nissan",
  "context": {
    "app": "portal",
    "appVersion": "1.0.0",
    "browser": "Chrome",
    "browserVersion": "116.0.5845.97",
    "os": "macOS",
    "osVersion": "14.5",
    "deviceType": "desktop",
    "screenResolution": "1920x1080",
    "ip": "203.0.113.xxx",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

**Aggregated Storage (PostgreSQL):**

```sql
CREATE TABLE aggregated_events (
    date DATE,
    companyId VARCHAR(50),
    eventCategory VARCHAR(50),
    eventAction VARCHAR(50),
    app VARCHAR(50),
    deviceType VARCHAR(50),
    country VARCHAR(50),
    totalEvents BIGINT,
    uniqueUsers BIGINT
);
```

---

## 7. Design Decisions

### A. Solution: Open Source Ready-Made

Open-source tools strike a balance between control, cost, and ease of adoption. Unlike proprietary vendors, they ensure data ownership and compliance, while being faster to implement than building from scratch. Options like Plausible or PostHog offer transparency, extensibility, and lower long-term costs, making them a practical middle ground ready-made yet adaptable to our evolving needs without vendor lock-in.

### B. Tool: Plausible

#### Key Reasons:

- **Lean, low-ops stack (cost at scale):** Plausible CE runs as a small Elixir app with PostgreSQL + ClickHouse. [Plausible's GitHub Readme](https://github.com/plausible/community-edition?utm_source=chatgpt.com) recommends \~2 GB RAM and standard CPU features, keeping infra simple and affordable. [PostHog’s self-host docs](https://posthog.com/docs/self-host?utm_source=chatgpt.com) recommend 4 vCPU / 16 GB RAM baseline, which raises costs at scale.
- **Modern, scalable core:** [Elixir](https://elixir-lang.org/) (high concurrency) + [ClickHouse](https://clickhouse.com/) (columnar analytics) delivers fast queries and scale without extra moving parts. Trench, for example, is Kafka + ClickHouse—powerful but heavier to operate.
- **Minimal footprint (just what we need):** Plausible focuses on pageviews + event tracking—avoiding bloat like feature flags, session replay, and experiments. PostHog bundles these, but they add infra and complexity.
- **SaaS fit:** Our immediate need is reliable event capture. Since the product will evolve, it’s better to layer custom features (funnels, cohorts, tenant-specific reports) on top of our data model instead of adopting a full-suite analytics tool upfront.

#### Trade-offs (accepted):

- Fewer built-ins than PostHog/Matomo (no feature flags, replay, heatmaps)—we’ll build only what we need.
- **Event schema flexibility:** PostHog allows arbitrary properties and transformations; Plausible constrains events to name + properties. This simplifies storage but caps flexibility; complex schemas need custom backend work.
- **Ecosystem maturity:** PostHog/Matomo have larger plugin ecosystems and marketplaces. Plausible CE is leaner with a smaller community, so fewer “drop-in” solutions for edge cases.

### C. Vendor Agnostic: Using Analytics library

Use [Analytics](https://www.npmjs.com/package/analytics), a lightweight analytics abstraction library for tracking page views, custom events, & identify visitors. It provides a clean API and plugin system, so switching vendors requires minimal changes.

### D. Multi-Tenant Segmentation: Using Custom attributes

We handle multi-tenancy by storing companyId as a custom attribute along with each event. This allows segmentation while keeping data in the same Plausible instance (similar to how our core DB works). And on dashboard we can use it as a filter or show company specific separate dashboard altogether.

### E. Custom Dashboards: Build in-house

Most analytics tools offer built-in reporting dashboards and allow embedding via iframes. However, since we require deeper customization and consistent branding, it’s better to build our own custom dashboard.

ClickHouse provides an HTTP interface that the frontend can consume directly, but for added security and flexibility, we should introduce a backend layer to handle authentication and other logic before exposing data to the UI.

---

## 9. References

- [Plausible vs GA](https://plausible.io/vs-google-analytics)
- [Plausible Technology choices](https://plausible.io/blog/technology-choices)
- [Plausible Data Policy](https://plausible.io/data-policy)
- [Interesting blogs around Analytics](https://plausible.io/blog)
