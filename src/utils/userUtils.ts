import { User } from '../types';

/**
 * Robust utility to reliably extract registration timestamp from a User object
 * Handles ISO strings, Firestore Timestamps, custom field names, and usr_ ID embedded timestamps.
 */
export function getUserRegistrationTimestamp(u: Partial<User> | null | undefined): number {
  if (!u) return 0;

  // 1. Direct fields: createdAt, created_at, timestamp, regDate
  const anyUser = u as Record<string, any>;
  const raw = u.createdAt || anyUser.created_at || anyUser.timestamp || anyUser.regDate;

  if (raw) {
    // Firestore Timestamp object
    if (typeof raw === 'object' && typeof raw.toMillis === 'function') {
      const ms = raw.toMillis();
      if (!isNaN(ms) && ms > 0) return ms;
    }
    if (typeof raw === 'object' && typeof raw._seconds === 'number') {
      const ms = raw._seconds * 1000 + (raw._nanoseconds ? Math.floor(raw._nanoseconds / 1e6) : 0);
      if (!isNaN(ms) && ms > 0) return ms;
    }
    if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
      return raw > 1e11 ? raw : raw * 1000;
    }
    if (typeof raw === 'string') {
      const parsed = new Date(raw).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  // 2. Extract timestamp from ID pattern: usr_<timestamp>_<random>
  if (u.id && typeof u.id === 'string') {
    const match = u.id.match(/^usr_(\d{10,13})/);
    if (match && match[1]) {
      const digits = match[1];
      const parsed = parseInt(digits.length === 10 ? digits + '000' : digits, 10);
      if (!isNaN(parsed) && parsed > 1e11) {
        return parsed;
      }
    }
  }

  return 0;
}

/**
 * Checks if a user was registered within the specified threshold (default: 7 days)
 */
export function isUserRecentlyRegistered(u: Partial<User> | null | undefined, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  if (!u) return false;
  const ts = getUserRegistrationTimestamp(u);
  if (ts <= 0) return false;
  return Date.now() - ts < maxAgeMs;
}

/**
 * Checks if a user was registered very recently (e.g. within last 30 minutes)
 */
export function isUserRegisteredJustNow(u: Partial<User> | null | undefined, maxAgeMs: number = 30 * 60 * 1000): boolean {
  if (!u) return false;
  const ts = getUserRegistrationTimestamp(u);
  if (ts <= 0) return false;
  return Date.now() - ts < maxAgeMs;
}

/**
 * Returns a localized human-readable registration relative or absolute time string
 */
export function formatUserRegistrationTime(u: Partial<User> | null | undefined): string {
  if (!u) return 'Earlier';
  const ts = getUserRegistrationTimestamp(u);
  if (ts <= 0) return 'Earlier';

  const diffMs = Date.now() - ts;
  if (diffMs < 60 * 1000) {
    return 'अभी-अभी (Just now)';
  }
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.floor(diffMs / (60 * 1000));
    return `${mins} मिनट पहले`;
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours} घंटे पहले`;
  }

  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Sorts an array of users with the newest registered users guaranteed to be first (index 0)
 */
export function sortUsersNewestFirst(usersList: User[]): User[] {
  if (!Array.isArray(usersList)) return [];
  return [...usersList].sort((a, b) => {
    const tA = getUserRegistrationTimestamp(a);
    const tB = getUserRegistrationTimestamp(b);
    return tB - tA;
  });
}
