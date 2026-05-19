/**
 * Internal cache for active or recent requests to prevent spamming
 */
const requestCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 2000; // 2 seconds cache for "me" endpoint

/**
 * Helper to fetch JSON from API and handle non-JSON responses gracefully
 */
export async function fetchJson(url: string, options: RequestInit = {}, retries = 2) {
  // Simple cache for auth/me to prevent rapid re-renders from spamming
  if (url === '/api/auth/me' && !options.method || options.method === 'GET') {
    const cached = requestCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const userId = localStorage.getItem('dw_userId');
  
  const headers = new Headers(options.headers || {});
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Handle Rate Limiting (429) - either from server or proxy
      if (response.status === 429 && retries > 0) {
        const delay = (3 - retries) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchJson(url, options, retries - 1);
      }

      if (response.status === 401) {
        const hadUserId = localStorage.getItem('dw_userId');
        if (hadUserId) {
          console.warn("Unauthorized! Clearing local storage.");
          localStorage.removeItem('dw_userId');
          window.dispatchEvent(new CustomEvent('api-unauthorized'));
        }
      }

      if (isJson) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      } else {
        const text = await response.text();
        // Specifically check for "Rate exceeded" which is a common proxy error
        if (text.includes("Rate exceeded") && retries > 0) {
          const delay = (3 - retries) * 1000 + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchJson(url, options, retries - 1);
        }
        console.error(`Received non-JSON error response from ${url}:`, text.substring(0, 200));
        throw new Error(text.includes("Rate exceeded") ? "System is under high load. Retrying..." : `Server returned error status ${response.status}`);
      }
    }

    if (!isJson) {
      const text = await response.text();
      console.error(`Received non-JSON response from ${url}:`, text.substring(0, 200));
      throw new Error('API returned HTML/text instead of JSON.'); 
    }

    const data = await response.json();
    
    // Cache the successful "me" response
    if (url === '/api/auth/me') {
      requestCache.set(url, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (err: any) {
    // If it's a network error and we have retries left
    if (err.name === 'TypeError' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchJson(url, options, retries - 1);
    }
    throw err;
  }
}
