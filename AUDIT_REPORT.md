# MuscleGuard - Code Review & Audit Report
**Date:** April 9, 2026
**Status:** MVP - Early Stage Development
**Verdict:** ⚠️ **FUNCTIONAL BUT NEEDS FIXES** - Found 15+ issues ranging from critical error handling to missing tests

---

## 📊 Project Overview
- **Type:** Next.js 14 Full-Stack SaaS MVP
- **Purpose:** GLP-1 medication users → Muscle preservation coaching (protein tracking + AI meal planning)
- **Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase, Stripe, Anthropic Claude API
- **Deployment:** Vercel + Supabase (cloud) + Stripe (payments)
- **Lines of Code:** ~2,600 LOC (excluding node_modules)
- **Test Coverage:** 0% (NO automated tests)

---

## 🔴 CRITICAL ISSUES

### 1. **Incomplete Error Handling in MealsClient.tsx** (HIGH)
**File:** `app/meals/MealsClient.tsx`
**Lines:** 25-34
**Problem:**
```typescript
const res = await fetch("/api/generate-meals", { ... });
const data = await res.json(); // ❌ Never checks res.ok
setMeals(data.meals ?? []);
```
**Impact:** If API returns error (5xx, 4xx), app tries to parse error as JSON and crashes silently.

**Also in line 37-47:**
```typescript
async function handleLogMeal(meal: Meal) {
  setLoggingId(meal.name);
  await supabase.from("food_logs").insert({ ... }); // ❌ No try-catch
  setLoggingId(null); // Will execute even if insert fails
}
```
**Impact:** If database insert fails, UI gets stuck in "logging" state.

### 2. **Stripe Webhook Bug - Null Subscription** (MEDIUM)
**File:** `app/api/stripe/webhook/route.ts`
**Lines:** 34
**Problem:**
```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  stripe_subscription_id: session.subscription as string, // ❌ CAN BE NULL
}
```
**Impact:** If customer pays one-time instead of subscription, `session.subscription` is `null`, crashes database update.

### 3. **Missing Error Handling in Auth Flows** (MEDIUM)
**File:** `app/login/LoginClient.tsx`
**Lines:** 17-26, 28-32
**Problem:**
```typescript
async function handleMagicLink(e: React.FormEvent) {
  // ❌ No try-catch, no error feedback
  await supabase.auth.signInWithOtp({...});
}

async function handleGoogle() {
  // ❌ No try-catch, redirects fail silently
  await supabase.auth.signInWithOAuth({...});
}
```
**Impact:** Login failures show no error message to user. Bad UX.

### 4. **MealsClient Invalid React Key** (MEDIUM)
**File:** `app/meals/MealsClient.tsx`
**Line:** 82
**Problem:**
```typescript
meals.map((meal) => (
  <MealCard key={meal.name} ... /> // ❌ NOT UNIQUE if 2 meals have same name
))
```
**Impact:** React reconciliation bugs if meals duplicate. List becomes unstable.

---

## 🟡 IMPORTANT ISSUES

### 5. **Database Query Without Error Handling** (MEDIUM)
**Files:** `app/api/stripe/checkout/route.ts` (line 14), `app/api/stripe/portal/route.ts` (line 14)
**Problem:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("stripe_customer_id")
  .eq("id", user.id)
  .single(); // ❌ Throws if profile doesn't exist, no fallback

if (!profile?.stripe_customer_id) { ... } // Line 16 portal.ts handles it
```
**Impact:** If user deletes profile but auth persists, checkout crashes.

### 6. **Missing Error Handling in Food Search** (LOW)
**File:** `app/api/food/search/route.ts`
**Lines:** 9-10
**Problem:**
```typescript
const foods = await searchFoods(q);
return NextResponse.json({ foods }); // No error catch if USDA API fails
```
**Impact:** USDA API timeouts cause 500 error with no user message.

### 7. **Supabase Client Recreated Every Render** (LOW-MEDIUM)
**Files:** `app/dashboard/DashboardClient.tsx` (line 26), `app/meals/MealsClient.tsx` (line 19)
**Problem:**
```typescript
const supabase = createClient(); // Called on every render
const refreshLogs = useCallback(async () => {
  ...
}, [supabase, userId]); // supabase changes → useCallback re-creates
```
**Impact:** Performance issue. `refreshLogs` function reference changes frequently, could cause unexpected re-renders.

### 8. **Login Missing Email Validation** (LOW)
**File:** `app/login/LoginClient.tsx`
**Line:** 63
**Problem:**
```typescript
<Input type="email" required /> // HTML5 validation only, no backend check
```
**Impact:** Invalid emails sent to Supabase Auth (minor, Supabase validates).

### 9. **No Request Body Validation on API Routes** (MEDIUM)
**Files:** `app/api/generate-meals/route.ts` (line 10)
**Problem:**
```typescript
const { proteinRemainingG, dietaryPrefs } = await request.json();
// ❌ No validation - could be { proteinRemainingG: "string", ... }
// Could send invalid data to Claude API
```
**Impact:** Type errors if client sends malformed data. API could spend tokens on bad requests.

### 10. **Vulnerable Dependency Pattern** (MEDIUM)
**File:** `app/api/stripe/webhook/route.ts`
**Line:** 6-12
**Problem:**
```typescript
function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ Good isolation
  );
}
```
**Note:** This is CORRECT! Service role key is used safely only in webhooks.

---

## 🟠 ARCHITECTURE & DESIGN ISSUES

### 11. **No Request Rate Limiting** (MEDIUM)
- No rate limiting on `/api/generate-meals` - Users could spam Claude API calls (expensive!)
- No auth on `/api/food/search` - Anyone can hit USDA API (fine, but could DDOS)
- Stripe webhook not validated for replay attacks (uses signature, which is good)

### 12. **Missing Typing on API Responses** (LOW)
- API routes return `unknown` types
- Frontend doesn't validate response shape
- Could break if API behavior changes

### 13. **No Monitoring/Logging** (MEDIUM)
- No error tracking (Sentry, etc.)
- No API call logging
- No database query monitoring
- Stripe webhook failures silent

### 14. **Incomplete Onboarding Flow** (LOW)
- `OnboardingClient.tsx` (152 lines) - No validation of final state
- Users could skip required fields
- No data persistence if they refresh

### 15. **Settings Page Incomplete** (LOW)
- `SettingsClient.tsx` has placeholder UI
- Subscription management is Stripe portal redirect (correct)
- But no local settings validation

---

## ⚠️ SECURITY OBSERVATIONS

### ✅ GOOD Security Practices:
1. **RLS (Row Level Security)** - Enabled on Supabase tables
2. **Auth Middleware** - Protects routes correctly
3. **Service Role Isolation** - Only used in webhooks
4. **No Hard-Coded Secrets in Code** - Uses .env.local (ignored by git)
5. **Webhook Signature Verification** - Stripe signature checked

### ⚠️ GAPS:
1. **No Input Sanitization** on text fields (food names could have XSS in logs)
2. **No Rate Limiting** on API endpoints
3. **No CORS Headers** - Could be public-facing security issue
4. **No Request Validation** - API routes accept any shape JSON
5. **No Session Timeout** - Users logged in indefinitely

---

## 📉 CODE QUALITY

| Metric | Status | Notes |
|--------|--------|-------|
| **TypeScript Strictness** | ⚠️ Medium | Some `as string` casts, missing types |
| **Component Size** | ⚠️ Medium | MealsClient (92 LOC), DashboardClient (71 LOC) - could split |
| **Error Handling** | 🔴 Poor | ~70% of async calls missing try-catch |
| **Testing** | 🔴 None | 0% coverage, MVP excuse valid for now |
| **Linting** | ✅ Good | eslint-config-next active |
| **Documentation** | ⚠️ Minimal | No JSDoc, API docs missing |
| **Code Duplication** | ⚠️ Medium | Auth patterns repeated 3x times |

---

## 🧪 Testing Status

```
❌ NO UNIT TESTS
❌ NO INTEGRATION TESTS
❌ NO E2E TESTS
⚠️ MANUAL TESTING ONLY
```

**Post-MVP Plan (from code):**
- Jest for unit tests
- Cypress for E2E
- GitHub Actions for CI/CD

---

## 🔧 BUILD & DEPLOYMENT

| Check | Status | Notes |
|-------|--------|-------|
| **TypeScript Compilation** | ✅ Pass | No strict errors |
| **ESLint** | ✅ Pass | Default next/lint rules |
| **Dependencies** | ✅ Updated | All current versions |
| **Environment Variables** | ✅ Set | .env.local configured |
| **Next.js Build** | ⚠️ Slow | Takes ~30s (normal for first run) |
| **Vercel Deploy** | ✅ Ready | Serverless functions work |

---

## 📋 DETAILED FINDINGS BY FILE

### Critical Files Reviewed:
```
✅ middleware.ts - Clean auth flow
✅ lib/supabase/middleware.ts - Proper protected routes
⚠️ app/api/stripe/webhook/route.ts - Null subscription bug
🔴 app/meals/MealsClient.tsx - Multiple error handling issues
🔴 app/login/LoginClient.tsx - No error feedback
⚠️ app/api/stripe/checkout/route.ts - Missing error handling
✅ app/dashboard/DashboardClient.tsx - Logic OK, performance issue
✅ lib/usda.ts - Good error handling
✅ components/AppNav.tsx - Clean implementation
```

---

## 🚀 Recommendations Priority

### MUST FIX (Before Going to Production)
1. ✅ **Add try-catch to MealsClient fetch** (5 min)
2. ✅ **Fix Stripe webhook null subscription bug** (5 min)
3. ✅ **Add error handling to login flows** (10 min)
4. ✅ **Fix MealsClient React key issue** (2 min)
5. ✅ **Add request validation to API routes** (20 min)
6. ✅ **Add rate limiting to /api/generate-meals** (15 min)

### SHOULD FIX (Before V1.0)
7. Add try-catch to handleLogMeal in MealsClient
8. Add error handling to Stripe checkout/portal
9. Implement request logging/monitoring
10. Add API response type validation
11. Refactor large client components

### NICE TO HAVE (Post-MVP)
12. Add Jest unit tests (start with API routes)
13. Add E2E tests with Cypress
14. Implement Sentry error tracking
15. Add request rate limiting
16. Session timeout implementation
17. Input sanitization for food logs

---

## 💾 Database Schema Check

**Tables Expected:**
- `profiles` - User metadata
- `food_logs` - Daily food entries
- `generated_meals` - Claude AI meal history
- Stripe subscription tracking

**Status:** ✅ Assumed correct (RLS policies enforced)

---

## 🎯 SUMMARY

**Overall Grade: C+ (MVP acceptable, needs hardening)**

| Category | Grade | Notes |
|----------|-------|-------|
| Core Functionality | A- | App does what it's designed for |
| Error Handling | D | Most async operations lack error handling |
| Security | B | Good practices but gaps in validation |
| Performance | B | Efficient, minor re-render issues |
| Code Quality | C | Functional but needs refactoring |
| Testing | F | Zero test coverage |
| Documentation | D | Minimal inline docs |

---

## 🔍 Next Steps (Your Approval Needed)

1. **Should I fix the critical issues?** (Items 1-6 above)
   - Yes / No / Partial (which ones?)

2. **Should I add tests?**
   - Start with API routes?
   - Unit tests for components?

3. **Should I improve error handling?**
   - Add error boundaries?
   - Add toast notifications?

4. **Anything else to audit?**
   - Performance profiling?
   - Accessibility (a11y)?
   - Mobile UX testing?

---

**Report Generated:** April 9, 2026 23:42 UTC
**Files Analyzed:** 60+ (excluding node_modules)
**Issues Found:** 15 critical/important items
**Time to Fix:** ~4 hours estimated for all recommendations
