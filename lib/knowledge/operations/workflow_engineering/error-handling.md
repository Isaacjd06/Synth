---
id: error-handling
title: Error Handling in Workflow Automation
domain: operations/workflow_engineering
level: core
tags: [error-handling, reliability, retry, failures, resilience]
summary: "Comprehensive guide to error handling in workflow automation: error classification, retry strategies, fallback patterns, circuit breakers, and building resilient systems"
last_reviewed: "2025-12-04"
reliability: "high"
related_topics: [workflow-design, automation-patterns, api-fundamentals]
---

# Error Handling in Workflow Automation

## Introduction

Error handling is not optional—it's the difference between workflows that run reliably in production and those that fail constantly. This document provides a comprehensive framework for handling errors in workflow automation, from classification to recovery strategies.

### Why Error Handling Matters

**Without proper error handling:**
- Transient failures (network blips) kill entire workflows
- Data loss occurs when operations partially complete
- Users receive no actionable error messages
- Debugging failures is nearly impossible
- Workflows become fragile and untrusted

**With proper error handling:**
- Workflows recover automatically from transient issues
- Data consistency is maintained
- Users receive clear guidance on what went wrong
- Failures are logged with full context for debugging
- Workflows run reliably at scale

---

## Error Classification

### 1. Transient Errors (Retry)

**Characteristics:**
- Temporary condition
- Likely to succeed if retried
- No user action required

**Examples:**
- Network timeouts
- DNS resolution failures
- Server temporarily unavailable (503)
- Rate limit exceeded (429)
- Database deadlock
- Connection pool exhausted

**Response Strategy:**
- Retry with exponential backoff
- Add jitter to prevent thundering herd
- Max 3-5 attempts
- Log each attempt

---

### 2. Permanent Errors (Don't Retry)

**Characteristics:**
- Won't resolve automatically
- Retrying wastes resources
- Requires user action or code fix

**Examples:**
- Bad request (400) - invalid data format
- Unauthorized (401) - invalid credentials
- Forbidden (403) - insufficient permissions
- Not found (404) - resource doesn't exist
- Unprocessable entity (422) - validation failed
- Conflict (409) - duplicate key violation

**Response Strategy:**
- Fail immediately
- Log error details
- Notify user with actionable message
- Don't retry

---

### 3. Ambiguous Errors (Investigate)

**Characteristics:**
- Unclear if operation completed
- Retry might cause duplicates
- Requires idempotency or investigation

**Examples:**
- Network timeout after sending request
- Connection closed mid-operation
- Process killed before confirmation
- Webhook delivery uncertainty

**Response Strategy:**
- Use idempotency keys for safe retry
- Query operation status before retry
- Implement deduplication
- Log ambiguity for manual review if needed

---

### 4. Critical Errors (Alert Immediately)

**Characteristics:**
- Business-critical failure
- Requires immediate attention
- May have financial or compliance impact

**Examples:**
- Payment processing failure
- Data corruption detected
- Security breach attempt
- Compliance violation
- Data loss

**Response Strategy:**
- Fail workflow immediately
- Send high-priority alert (SMS, PagerDuty, etc.)
- Log full context
- May trigger incident response

---

## Retry Strategies

### Exponential Backoff

**Most recommended strategy for transient errors.**

**How It Works:**
```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds
Attempt 3: Wait 4 seconds
Attempt 4: Wait 8 seconds
Attempt 5: Wait 16 seconds (or max delay cap)
```

**Formula:**
```javascript
delay = min(initial_delay * (backoff_multiplier ^ attempt_number), max_delay)
```

**Configuration:**
```json
{
  "retry": {
    "max_attempts": 5,
    "initial_delay": "2s",
    "backoff_multiplier": 2,
    "max_delay": "60s"
  }
}
```

**Pros:**
- Gives systems time to recover
- Reduces load on failing services
- Well-established pattern

**Cons:**
- Can add significant latency
- Not suitable for time-sensitive operations

---

### Exponential Backoff with Jitter

**Best practice for distributed systems.**

**How It Works:**
```
Attempt 1: Immediate
Attempt 2: Wait 2s ± random(0, 1s)
Attempt 3: Wait 4s ± random(0, 2s)
Attempt 4: Wait 8s ± random(0, 4s)
```

**Formula:**
```javascript
base_delay = initial_delay * (backoff_multiplier ^ attempt_number)
jitter = random(0, base_delay * 0.5)
delay = min(base_delay + jitter, max_delay)
```

**Why Jitter:**
- Prevents thundering herd (all clients retry simultaneously)
- Spreads retry load over time
- Increases success rate when service recovers

---

### Fixed Delay

**Simple but less effective.**

**How It Works:**
```
Attempt 1: Immediate
Attempt 2: Wait 5 seconds
Attempt 3: Wait 5 seconds
Attempt 4: Wait 5 seconds
```

**When to Use:**
- Quick operations (< 1 second)
- Known recovery time (e.g., "rate limit resets every 60 seconds")
- Testing/debugging

**Cons:**
- Doesn't give overloaded systems time to recover
- Can waste time if issue is permanent

---

### Adaptive Retry

**Advanced: Adjust strategy based on error patterns.**

**How It Works:**
```
Track recent failure rates:
- If failure rate < 5%: Standard exponential backoff
- If failure rate 5-20%: Increase backoff multiplier
- If failure rate > 20%: Circuit breaker opens
```

**When to Use:**
- High-frequency workflows
- Workflows calling unreliable services
- Production systems with monitoring

---

## Retry Configuration by Error Type

### Network Timeouts
```json
{
  "max_attempts": 3,
  "initial_delay": "1s",
  "backoff": "exponential",
  "backoff_multiplier": 2,
  "max_delay": "10s",
  "jitter": true
}
```

### Rate Limits (429)
```json
{
  "max_attempts": 3,
  "initial_delay": "60s",
  "backoff": "fixed",
  "respect_retry_after_header": true
}
```

### Server Errors (500, 502, 503, 504)
```json
{
  "max_attempts": 5,
  "initial_delay": "2s",
  "backoff": "exponential",
  "backoff_multiplier": 2,
  "max_delay": "60s",
  "jitter": true
}
```

### Database Deadlocks
```json
{
  "max_attempts": 3,
  "initial_delay": "100ms",
  "backoff": "exponential",
  "backoff_multiplier": 2,
  "max_delay": "2s",
  "jitter": true
}
```

---

## Fallback Patterns

### 1. Default Values

**Use Case:** Enrichment step fails, continue with basic data

**Pattern:**
```javascript
const enrichedData = await fetchEnrichment(userId).catch(() => null)
const finalData = enrichedData || { basic: true }
```

**When to Use:**
- Optional enhancements
- Non-critical data
- Acceptable degraded experience

**Example:**
```
User profile fetch fails → Use "Unknown User" as name
Geocoding API fails → Use provided zip code without lat/lon
```

---

### 2. Alternative Service

**Use Case:** Primary service down, switch to backup

**Pattern:**
```javascript
let result
try {
  result = await primaryService.fetch()
} catch (error) {
  console.log('Primary failed, trying backup')
  result = await backupService.fetch()
}
```

**When to Use:**
- Critical operations
- Known reliable backup
- Cost-acceptable alternative

**Example:**
```
Primary payment processor down → Use backup processor
Image CDN unavailable → Serve from origin server
```

---

### 3. Cached Data

**Use Case:** Fresh data unavailable, use stale cache

**Pattern:**
```javascript
const cached = cache.get(key)
try {
  const fresh = await api.fetch()
  cache.set(key, fresh)
  return fresh
} catch (error) {
  if (cached) {
    console.log('Using cached data due to API failure')
    return cached
  }
  throw error
}
```

**When to Use:**
- Read-heavy operations
- Data that doesn't change frequently
- User experience priority over freshness

**Example:**
```
Product catalog API down → Show cached products
Weather API fails → Display last known weather
```

---

### 4. Graceful Degradation

**Use Case:** Feature unavailable, disable it gracefully

**Pattern:**
```javascript
let recommendations = []
try {
  recommendations = await getPersonalizedRecommendations(userId)
} catch (error) {
  console.log('Personalization unavailable, showing popular items')
  recommendations = await getPopularItems()
}
```

**When to Use:**
- Non-essential features
- Better than total failure
- Clear to user what's happening

**Example:**
```
Recommendation engine down → Show popular items instead
Real-time inventory unavailable → Show estimated availability
```

---

### 5. Retry Later Queue

**Use Case:** Can't process now, queue for later

**Pattern:**
```javascript
try {
  await processOrder(order)
} catch (error) {
  if (isTransientError(error)) {
    await retryQueue.add(order, { delay: '5m' })
    console.log('Queued for retry in 5 minutes')
  } else {
    throw error
  }
}
```

**When to Use:**
- Non-time-sensitive operations
- High failure rates
- Resource constraints

**Example:**
```
Email send fails → Queue for retry in 5 minutes
Webhook delivery fails → Queue for retry with backoff
```

---

## Circuit Breaker Pattern

### What It Is

Prevents calling failing services repeatedly, allowing them to recover.

### States

**1. Closed (Normal Operation)**
- Requests flow through normally
- Track failure rate
- If failures exceed threshold → Open

**2. Open (Failing Fast)**
- Requests fail immediately without calling service
- No load on failing service
- After timeout period → Half-Open

**3. Half-Open (Testing Recovery)**
- Allow limited requests through
- If successful → Closed
- If failed → Open

### Implementation

```javascript
class CircuitBreaker {
  constructor(options) {
    this.failureThreshold = options.failureThreshold || 5
    this.timeout = options.timeout || 60000 // 60 seconds
    this.successThreshold = options.successThreshold || 2

    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt = Date.now()
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0
    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED'
        this.successCount = 0
      }
    }
  }

  onFailure() {
    this.failureCount++
    this.successCount = 0
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
    }
  }
}
```

### When to Use

- Frequently-called unreliable service
- Want to fail fast during outages
- Need to reduce load on failing service
- Have acceptable fallback behavior

---

## Error Logging and Observability

### Essential Error Information

**Every error log should include:**
1. **Timestamp** - When error occurred
2. **Workflow/Execution ID** - What was running
3. **Step ID** - Where it failed
4. **Error Type** - Classification (transient, permanent, etc.)
5. **Error Message** - What went wrong
6. **Stack Trace** - Code path (if applicable)
7. **Input Data** - What triggered the failure (sanitize sensitive data)
8. **Retry Attempt** - Which attempt (1st, 2nd, etc.)
9. **Context** - User ID, correlation ID, etc.

### Log Format Example

```json
{
  "timestamp": "2025-12-04T10:30:15.234Z",
  "level": "ERROR",
  "workflow_id": "wf_sync_contacts",
  "execution_id": "exec_abc123",
  "step_id": "fetch_hubspot_contacts",
  "error_type": "RATE_LIMIT",
  "error_code": 429,
  "error_message": "Rate limit exceeded. Retry after 60 seconds",
  "http_status": 429,
  "retry_attempt": 2,
  "max_attempts": 3,
  "next_retry_in": "60s",
  "user_id": "user_456",
  "correlation_id": "corr_789",
  "context": {
    "api_endpoint": "/v3/objects/contacts",
    "rate_limit_remaining": 0,
    "rate_limit_reset": 1733313075
  }
}
```

### Error Metrics to Track

**Failure Rate:**
```
failures / total_executions
```

**Mean Time Between Failures (MTBF):**
```
total_time / failure_count
```

**Mean Time To Recovery (MTTR):**
```
sum(recovery_time) / failure_count
```

**Error Distribution:**
- By error type (4xx, 5xx, timeout, etc.)
- By step (which step fails most?)
- By time (when do failures occur?)

---

## User-Facing Error Messages

### Principles

**1. Explain What Happened**
- Clear, non-technical language
- Specific about what failed
- Avoid jargon

**2. Explain Why**
- Root cause in simple terms
- Context if helpful

**3. Provide Actionable Next Steps**
- What user can do to fix
- Specific instructions
- Links to relevant settings/docs

### Examples

**Bad:**
```
Error: 401 Unauthorized
```

**Good:**
```
Gmail Connection Expired

Your Gmail connection has expired and needs to be reconnected.

To fix:
1. Go to Settings → Connections
2. Click "Reconnect" next to Gmail
3. Approve the permissions

This workflow will automatically retry once reconnected.
```

---

**Bad:**
```
Error: Rate limit exceeded
```

**Good:**
```
HubSpot Rate Limit Reached

You've reached HubSpot's API limit of 100 requests per 10 seconds.

What's happening:
- Your workflow makes 150 requests per run
- HubSpot allows 100 per 10 seconds
- Workflow will automatically retry in 60 seconds

To prevent this:
- Enable request batching (processes 10 contacts per request instead of 1)
- Reduce sync frequency from every 5 minutes to every 15 minutes
```

---

## Error Handling Anti-Patterns

### Anti-Pattern 1: Silent Failures

**Problem:** Errors swallowed, user never knows failure occurred

```javascript
// ❌ BAD
try {
  await sendEmail(user)
} catch (error) {
  // Silent failure
}
```

**Fix:** Always log and/or notify
```javascript
// ✅ GOOD
try {
  await sendEmail(user)
} catch (error) {
  console.error('Email send failed', error)
  await notifyUser('Email delivery failed. We'll retry in 5 minutes.')
  throw error
}
```

---

### Anti-Pattern 2: Retrying Permanent Errors

**Problem:** Wasting resources retrying 404 or 400 errors

```javascript
// ❌ BAD
for (let i = 0; i < 5; i++) {
  try {
    return await api.fetch(invalidId)
  } catch (error) {
    // Retries 404 five times (pointless)
  }
}
```

**Fix:** Check error type before retrying
```javascript
// ✅ GOOD
const isRetryable = (error) => {
  const retryableCodes = [429, 500, 502, 503, 504]
  return retryableCodes.includes(error.statusCode) || error.code === 'ETIMEDOUT'
}

for (let i = 0; i < 5; i++) {
  try {
    return await api.fetch(id)
  } catch (error) {
    if (!isRetryable(error)) {
      throw error // Don't retry permanent errors
    }
  }
}
```

---

### Anti-Pattern 3: No Maximum Retry Limit

**Problem:** Infinite retries waste resources

```javascript
// ❌ BAD
while (true) {
  try {
    return await api.fetch()
  } catch (error) {
    // Infinite loop if service permanently down
  }
}
```

**Fix:** Always set max attempts
```javascript
// ✅ GOOD
const MAX_ATTEMPTS = 5
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    return await api.fetch()
  } catch (error) {
    if (attempt === MAX_ATTEMPTS) throw error
    await sleep(2 ** attempt * 1000)
  }
}
```

---

### Anti-Pattern 4: Losing Error Context

**Problem:** Throwing generic errors loses debugging information

```javascript
// ❌ BAD
try {
  await complexOperation()
} catch (error) {
  throw new Error('Operation failed')
}
```

**Fix:** Preserve original error
```javascript
// ✅ GOOD
try {
  await complexOperation()
} catch (error) {
  throw new Error(`Operation failed: ${error.message}`, { cause: error })
}
```

---

## INTERNAL CHECK

### Areas Where Evidence Is Weaker or Context-Dependent

- **Retry attempt counts** - "3-5 attempts" is a heuristic; optimal value depends on operation type and urgency
- **Backoff timing** - Specific delays (2s, 4s, 8s) are common conventions but should be tuned per use case
- **Circuit breaker thresholds** - "5 failures" threshold is approximate; actual optimal value varies by service reliability
- **Failure rate percentages** - Adaptive retry thresholds (5%, 20%) are illustrative examples, not empirically derived

### Confirmation: No Fabricated Sources

- Error handling patterns described are established practices in distributed systems engineering
- Retry strategies (exponential backoff, jitter) are widely documented in cloud architecture guides
- Circuit breaker pattern is well-established (originally from Michael Nygard's "Release It!")
- HTTP status code interpretations are from official RFC specifications
- No invented statistics or fabricated case studies

### Confidence Levels by Section

- **Error Classification**: HIGH - Based on HTTP standards and distributed systems practices
- **Retry Strategies**: HIGH - Well-established patterns with proven effectiveness
- **Fallback Patterns**: HIGH - Common production patterns
- **Circuit Breaker Pattern**: HIGH - Established pattern with clear semantics
- **Error Logging**: HIGH - Standard observability practices
- **User-Facing Messages**: MEDIUM-HIGH - UX best practices, some subjectivity
- **Anti-Patterns**: HIGH - Commonly observed failure modes

### Final Reliability Statement

This document provides reliable guidance on error handling based on established distributed systems engineering practices, though specific configuration values (retry counts, delays, thresholds) should be tuned based on actual service characteristics and requirements.

---

## FILE COMPLETE

**Status:** Ready to save to `lib/knowledge/operations/workflow_engineering/error-handling.md`

**What This File Provides to Synth:**
- Comprehensive error classification framework for determining retry vs fail strategies
- Detailed retry strategies with exponential backoff and jitter implementation
- Fallback patterns for maintaining workflow reliability when errors occur
- Circuit breaker pattern for protecting failing services
- Error logging and observability best practices
- Guidelines for user-facing error messages
- Common anti-patterns to avoid in error handling

**When Synth Should Reference This File:**
- Designing error handling for new workflows
- Determining appropriate retry configuration for API calls
- Explaining to users why a workflow failed and what to do
- Implementing fallback strategies when primary operations fail
- Debugging workflows with high failure rates
- Determining when to use circuit breakers vs simple retries
- Logging errors with appropriate context for debugging
- Translating technical errors into user-friendly messages
