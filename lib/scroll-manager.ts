/**
 * Scroll Position Manager
 * 
 * Manages scroll position preservation across dashboard page navigation.
 * Excludes chat page which has its own auto-scroll behavior.
 */

const CHAT_PATH = '/app/chat';
const SCROLL_STORAGE_KEY = 'synth_dashboard_scroll';

interface ScrollState {
  path: string;
  scrollY: number;
  timestamp: number;
}

// Store scroll positions in memory (clears on page refresh)
let scrollCache: Map<string, number> = new Map();

/**
 * Save the current scroll position for the current path
 */
export function saveScrollPosition(path: string): void {
  if (path === CHAT_PATH) {
    // Don't save scroll position for chat page
    return;
  }

  const scrollY = window.scrollY || document.documentElement.scrollTop;
  scrollCache.set(path, scrollY);
  
  // Also store in sessionStorage as backup
  try {
    const state: ScrollState = {
      path,
      scrollY,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore storage errors (e.g., in private browsing)
  }
}

/**
 * Get the saved scroll position for a path
 */
export function getScrollPosition(path: string): number | null {
  if (path === CHAT_PATH) {
    // Chat page always auto-scrolls to bottom, don't restore position
    return null;
  }

  // Check memory cache first
  const cached = scrollCache.get(path);
  if (cached !== undefined) {
    return cached;
  }

  // Fallback to sessionStorage
  try {
    const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (stored) {
      const state: ScrollState = JSON.parse(stored);
      // Use stored position if it's for the same path and recent (within 5 minutes)
      if (state.path === path && Date.now() - state.timestamp < 5 * 60 * 1000) {
        return state.scrollY;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  return null;
}

/**
 * Apply scroll position to the current page
 */
export function applyScrollPosition(path: string, delay: number = 100): void {
  if (path === CHAT_PATH) {
    // Chat page handles its own scrolling
    return;
  }

  const savedPosition = getScrollPosition(path);
  if (savedPosition === null) {
    return;
  }

  // Apply scroll after a short delay to ensure DOM is ready
  setTimeout(() => {
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );
    const targetScroll = Math.min(savedPosition, maxScroll);
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'auto', // Use 'auto' for instant scroll, 'smooth' for animated
    });
  }, delay);
}

/**
 * Clear scroll position for a path
 */
export function clearScrollPosition(path: string): void {
  scrollCache.delete(path);
  try {
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Check if a path should use scroll position management
 */
export function shouldManageScroll(path: string): boolean {
  return path !== CHAT_PATH && path.startsWith('/app/');
}

