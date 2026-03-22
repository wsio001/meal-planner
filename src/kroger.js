/**
 * Kroger API Wrapper
 * Handles OAuth authentication, product search, cart management, and coupon clipping
 * API Documentation: https://developer.kroger.com/reference
 */

// Use CORS proxy for local development only
const isDevelopment = window.location.hostname === 'localhost';
const KROGER_API_BASE = isDevelopment
  ? 'https://api.allorigins.win/raw?url=https://api.kroger.com/v1'
  : 'https://api.kroger.com/v1';

// Helper to get correct redirect URI based on environment
function getRedirectURI() {
  const origin = window.location.origin;

  // Production
  if (origin.includes('wsio001.github.io')) {
    return 'https://wsio001.github.io/meal-planner/callback';
  }

  // Development - include /meal-planner/ base path
  return 'http://localhost:5173/meal-planner/callback';
}

// OAuth Configuration
const KROGER_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_KROGER_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_KROGER_CLIENT_SECRET,
  REDIRECT_URI: getRedirectURI(),
  SCOPE: 'product.compact cart.basic:write profile.compact',
  AUTH_URL: 'https://api.kroger.com/v1/connect/oauth2/authorize',
  TOKEN_URL: 'https://api.kroger.com/v1/connect/oauth2/token',
};

// Storage keys for OAuth tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kroger:access_token',
  REFRESH_TOKEN: 'kroger:refresh_token',
  TOKEN_EXPIRY: 'kroger:token_expiry',
};

// ============================================================================
// OAuth Authentication
// ============================================================================

/**
 * Check if user has a valid Kroger access token
 * @returns {boolean} True if authenticated and token is not expired
 */
export function isAuthenticated() {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

  if (!token || !expiry) return false;

  // Check if token is expired (with 5 minute buffer)
  return Date.now() < (parseInt(expiry) - 5 * 60 * 1000);
}

/**
 * Get stored access token
 * @returns {string|null} Access token or null if not authenticated
 */
export function getAccessToken() {
  if (!isAuthenticated()) return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Initiate OAuth flow by redirecting to Kroger authorization page
 */
export function initiateOAuth() {
  const state = generateRandomState();
  sessionStorage.setItem('kroger:oauth_state', state);

  const params = new URLSearchParams({
    client_id: KROGER_CONFIG.CLIENT_ID,
    redirect_uri: KROGER_CONFIG.REDIRECT_URI,
    response_type: 'code',
    scope: KROGER_CONFIG.SCOPE,
    state: state,
  });

  window.location.href = `${KROGER_CONFIG.AUTH_URL}?${params.toString()}`;
}

/**
 * Handle OAuth callback after user authorizes
 * @param {string} code - Authorization code from callback URL
 * @param {string} state - State parameter for CSRF protection
 * @returns {Promise<void>}
 * @throws {Error} If state doesn't match or token exchange fails
 */
export async function handleOAuthCallback(code, state) {
  // Verify state to prevent CSRF attacks
  // TEMPORARILY DISABLED for testing - re-enable for production
  // const savedState = sessionStorage.getItem('kroger:oauth_state');
  // if (state !== savedState) {
  //   throw new Error('Invalid OAuth state parameter');
  // }
  sessionStorage.removeItem('kroger:oauth_state');

  // Exchange authorization code for access token
  const tokenData = await exchangeCodeForToken(code);
  storeTokens(tokenData);
}

/**
 * Exchange authorization code for access token
 * @private
 */
async function exchangeCodeForToken(code) {
  const credentials = btoa(`${KROGER_CONFIG.CLIENT_ID}:${KROGER_CONFIG.CLIENT_SECRET}`);

  const response = await fetch(KROGER_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: KROGER_CONFIG.REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Refresh the access token using refresh token
 * @private
 */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const credentials = btoa(`${KROGER_CONFIG.CLIENT_ID}:${KROGER_CONFIG.CLIENT_SECRET}`);

  const response = await fetch(KROGER_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    // Refresh failed, clear tokens and require re-authentication
    clearTokens();
    throw new Error('Failed to refresh token, please log in again');
  }

  const tokenData = await response.json();
  storeTokens(tokenData);
  return tokenData.access_token;
}

/**
 * Store OAuth tokens in localStorage
 * @private
 */
function storeTokens(tokenData) {
  console.log('Storing tokens:', {
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    expiresIn: tokenData.expires_in
  });

  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token);

  // Calculate expiry timestamp (expires_in is in seconds)
  const expiryTime = Date.now() + (tokenData.expires_in * 1000);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());

  console.log('Tokens stored successfully');
}

/**
 * Clear all stored OAuth tokens
 */
export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
}

/**
 * Generate random state for OAuth CSRF protection
 * @private
 */
function generateRandomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// API Request Helper
// ============================================================================

/**
 * Make authenticated request to Kroger API
 * @private
 */
async function krogerRequest(endpoint, options = {}) {
  let token = getAccessToken();

  console.log('Making Kroger API request:', { endpoint, hasToken: !!token });

  // If no valid token, try to refresh
  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Authentication required. Please connect your Kroger account.');
    }
  }

  const url = `${KROGER_API_BASE}${endpoint}`;
  console.log('Fetching:', url);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  console.log('Response status:', response.status);

  // If token expired, try refreshing once
  if (response.status === 401) {
    token = await refreshAccessToken();
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!retryResponse.ok) {
      throw new Error(`Kroger API error: ${retryResponse.status} ${retryResponse.statusText}`);
    }

    return retryResponse.json();
  }

  if (!response.ok) {
    throw new Error(`Kroger API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// User Profile & Location
// ============================================================================

/**
 * Get user profile including zip code
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  return krogerRequest('/identity/profile');
}

/**
 * Get closest Kroger store based on zip code
 * @param {string} zipCode - User's zip code from profile
 * @param {number} radiusInMiles - Search radius (default 10)
 * @returns {Promise<Object>} Store location data
 */
export async function getClosestStore(zipCode, radiusInMiles = 10) {
  const params = new URLSearchParams({
    'filter.zipCode.near': zipCode,
    'filter.radiusInMiles': radiusInMiles,
    'filter.limit': 1, // Only need the closest store
  });

  const response = await krogerRequest(`/locations?${params.toString()}`);

  if (!response.data || response.data.length === 0) {
    throw new Error('No stores found near your location');
  }

  return response.data[0]; // Return closest store
}

/**
 * Get user's default store (from profile zip code)
 * @returns {Promise<Object>} Store data
 */
export async function getUserDefaultStore() {
  const profile = await getUserProfile();
  const zipCode = profile.data?.zip || profile.data?.address?.zip;

  if (!zipCode) {
    throw new Error('No zip code found in user profile');
  }

  return getClosestStore(zipCode);
}

// ============================================================================
// Product Search
// ============================================================================

/**
 * Search for products matching an ingredient
 * @param {string} searchTerm - Ingredient to search for
 * @param {string} locationId - Store location ID
 * @param {number} limit - Max results to return (default 20)
 * @returns {Promise<Array>} Array of product matches
 */
export async function searchProducts(searchTerm, locationId, limit = 20) {
  const params = new URLSearchParams({
    'filter.term': searchTerm,
    'filter.locationId': locationId,
    'filter.limit': limit,
  });

  const response = await krogerRequest(`/products?${params.toString()}`);
  return response.data || [];
}

/**
 * Get product details by UPC
 * @param {string} upc - Product UPC code
 * @param {string} locationId - Store location ID
 * @returns {Promise<Object>} Product details
 */
export async function getProductByUPC(upc, locationId) {
  const params = new URLSearchParams({
    'filter.locationId': locationId,
  });

  const response = await krogerRequest(`/products/${upc}?${params.toString()}`);
  return response.data;
}

/**
 * Find best product matches for an ingredient
 * Returns 3 options: best match, store brand, bigger size
 * @param {string} ingredient - Ingredient text from recipe
 * @param {string} locationId - Store location ID
 * @returns {Promise<Object>} { bestMatch, storeBrand, biggerSize }
 */
export async function findProductMatches(ingredient, locationId) {
  const products = await searchProducts(ingredient, locationId, 20);

  if (products.length === 0) {
    return { bestMatch: null, storeBrand: null, biggerSize: null };
  }

  // Sort by relevance (first result is usually best match)
  const bestMatch = products[0];

  // Find store brand (Kroger, Private Selection, Simple Truth)
  const storeBrands = ['kroger', 'private selection', 'simple truth'];
  const storeBrand = products.find(p =>
    storeBrands.some(brand => p.description?.toLowerCase().includes(brand))
  );

  // Find bigger size (sort by size/unit count)
  const withSizes = products.filter(p => p.items?.[0]?.size);
  const biggerSize = withSizes.sort((a, b) => {
    const sizeA = parseFloat(a.items[0].size) || 0;
    const sizeB = parseFloat(b.items[0].size) || 0;
    return sizeB - sizeA;
  })[0];

  return {
    bestMatch,
    storeBrand: storeBrand || bestMatch,
    biggerSize: biggerSize || bestMatch,
  };
}

// ============================================================================
// Cart Management
// ============================================================================

/**
 * Add items to Kroger cart
 * @param {Array<Object>} items - Array of { upc, quantity }
 * @returns {Promise<Object>} Cart response
 */
export async function addToCart(items) {
  const body = {
    items: items.map(item => ({
      upc: item.upc,
      quantity: item.quantity || 1,
    })),
  };

  return krogerRequest('/cart/add', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Get current cart contents
 * @returns {Promise<Object>} Cart data
 */
export async function getCart() {
  return krogerRequest('/cart');
}

// ============================================================================
// Coupon Management
// ============================================================================

/**
 * Get available coupons for user
 * @param {number} limit - Max coupons to fetch (default 100)
 * @returns {Promise<Array>} Array of available coupons
 */
export async function getAvailableCoupons(limit = 100) {
  const params = new URLSearchParams({
    'filter.limit': limit,
  });

  const response = await krogerRequest(`/coupons?${params.toString()}`);
  return response.data || [];
}

/**
 * Clip a digital coupon to user's account
 * @param {string} couponId - Coupon ID to clip
 * @returns {Promise<Object>} Clip response
 */
export async function clipCoupon(couponId) {
  return krogerRequest('/coupons/clip', {
    method: 'POST',
    body: JSON.stringify({
      couponId: couponId,
    }),
  });
}

/**
 * Clip multiple coupons at once
 * @param {Array<string>} couponIds - Array of coupon IDs
 * @returns {Promise<Array>} Array of clip results
 */
export async function clipMultipleCoupons(couponIds) {
  const results = [];

  for (const couponId of couponIds) {
    try {
      const result = await clipCoupon(couponId);
      results.push({ couponId, success: true, result });
    } catch (error) {
      results.push({ couponId, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Find and clip all relevant coupons for selected products
 * @param {Array<Object>} products - Array of selected products
 * @returns {Promise<Object>} { clipped, noMatch, total }
 */
export async function findAndClipCoupons(products) {
  const allCoupons = await getAvailableCoupons();
  const productUpcs = new Set(products.map(p => p.upc));

  // Match coupons to products (simple matching by brand/description)
  const matchingCoupons = allCoupons.filter(coupon => {
    // Check if coupon applies to any selected products
    return products.some(product =>
      coupon.description?.toLowerCase().includes(product.brand?.toLowerCase()) ||
      product.description?.toLowerCase().includes(coupon.brand?.toLowerCase())
    );
  });

  // Clip all matching coupons
  const clipResults = await clipMultipleCoupons(matchingCoupons.map(c => c.couponId));

  const clipped = clipResults.filter(r => r.success).length;
  const noMatch = products.length - clipped;

  return {
    clipped,
    noMatch,
    total: products.length,
    details: clipResults,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate savings from coupons and Kroger Plus
 * @param {Array<Object>} products - Products with pricing info
 * @param {Array<Object>} clippedCoupons - Coupons that were clipped
 * @returns {Object} { regularTotal, plusSavings, couponSavings, finalTotal }
 */
export function calculateSavings(products, clippedCoupons = []) {
  let regularTotal = 0;
  let plusSavings = 0;
  let couponSavings = 0;

  products.forEach(product => {
    const regularPrice = product.items?.[0]?.price?.regular || 0;
    const promoPrice = product.items?.[0]?.price?.promo || regularPrice;

    regularTotal += regularPrice;
    plusSavings += (regularPrice - promoPrice);
  });

  // Calculate coupon savings
  clippedCoupons.forEach(coupon => {
    couponSavings += coupon.value || 0;
  });

  const finalTotal = regularTotal - plusSavings - couponSavings;

  return {
    regularTotal: regularTotal.toFixed(2),
    plusSavings: plusSavings.toFixed(2),
    couponSavings: couponSavings.toFixed(2),
    finalTotal: finalTotal.toFixed(2),
  };
}

/**
 * Format product for display with unit pricing
 * @param {Object} product - Product data from API
 * @returns {Object} Formatted product info
 */
export function formatProduct(product) {
  const item = product.items?.[0];
  const price = item?.price?.regular || 0;
  const promoPrice = item?.price?.promo || price;
  const size = item?.size || '';

  return {
    upc: product.upc,
    name: product.description,
    brand: product.brand,
    size: size,
    price: price.toFixed(2),
    promoPrice: promoPrice.toFixed(2),
    savings: (price - promoPrice).toFixed(2),
    unitPrice: item?.price?.unitPrice || null,
  };
}
