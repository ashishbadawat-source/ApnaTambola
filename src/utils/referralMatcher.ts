import { User, ReferralCommission } from '../types';

/**
 * Cleanly extracts a referral code from any raw input (plain code, URL, query param, hash, phone, etc.)
 */
export function extractReferralCode(input: string | null | undefined): string {
  if (!input) return '';
  let str = String(input).trim();
  if (!str) return '';

  // Extract from full URLs, query strings, or hash params
  if (
    str.includes('?ref=') ||
    str.includes('&ref=') ||
    str.includes('?referral=') ||
    str.includes('&referral=') ||
    str.includes('?r=') ||
    str.includes('&r=') ||
    str.includes('#ref=') ||
    str.includes('/register?ref=') ||
    str.includes('ref=')
  ) {
    const match = str.match(/(?:[?&#]|register\?)(?:ref|referral|r)=([^&#\s]+)/i);
    if (match && match[1]) {
      str = decodeURIComponent(match[1]);
    }
  }

  // Remove leading / trailing quotes, slashes, or hashes
  str = str.replace(/^[/\\#?&]+/, '').replace(/['"]/g, '').trim();

  return str.toUpperCase();
}

/**
 * Bulletproof check if child user was referred by parent user
 */
export function isDirectChildOf(
  child: User | null | undefined,
  parent: User | null | undefined,
  commissionsList?: ReferralCommission[]
): boolean {
  if (!child || !parent) return false;
  if (child.id === parent.id) return false;

  const pId = (parent.id || '').trim().toUpperCase();
  const pCode = (parent.referralCode || '').trim().toUpperCase();
  const pCodeNoPrefix = pCode.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '');
  const pPhone = (parent.phone || '').replace(/\D/g, '');
  const pEmail = (parent.email || '').trim().toLowerCase();
  const pName = (parent.name || '').trim().toUpperCase();

  const childObj = child as any;

  // 1. Direct referredByUserId or sponsorId match (highest accuracy)
  const childReferrerUserIds = [
    child.referredByUserId,
    childObj.sponsorId,
    childObj.referrerId,
    childObj.uplineId,
    childObj.parentUserId,
  ].filter(Boolean) as string[];

  for (const cRefUserIdRaw of childReferrerUserIds) {
    const cRefUserId = String(cRefUserIdRaw).trim().toUpperCase();
    if (cRefUserId === pId) return true;
    if (pCode && cRefUserId === pCode) return true;
    if (pCodeNoPrefix && cRefUserId.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '') === pCodeNoPrefix) return true;
  }

  // Admin alias matching check (handles REF-ADM001, REF-ADMIN, ADM001, ADMIN, etc.)
  const isAdminParent = parent.role === 'admin' || pId === 'USR_ADMIN_001' || pCode.includes('ADMIN') || pCode.includes('ADM');

  // 2. Matching child.referredBy or sponsorCode / referrerCode strings
  const childReferrerCodes = [
    child.referredBy,
    childObj.sponsorCode,
    childObj.referrerCode,
    childObj.referrer,
    childObj.sponsor,
    childObj.upline,
    childObj.uplineCode,
  ].filter(Boolean) as string[];

  for (const rawCode of childReferrerCodes) {
    const cleanRaw = extractReferralCode(rawCode);
    const cleanNoPrefix = cleanRaw.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '');
    const cleanDigits = cleanRaw.replace(/\D/g, '');
    const cleanLower = String(rawCode).trim().toLowerCase();

    // Admin alias check
    if (isAdminParent) {
      if (
        cleanRaw === 'REF-ADMIN' ||
        cleanRaw === 'REF-ADM001' ||
        cleanRaw === 'REF-ADM' ||
        cleanNoPrefix === 'ADMIN' ||
        cleanNoPrefix === 'ADM001' ||
        cleanNoPrefix === 'ADM' ||
        cleanRaw.includes('ADM')
      ) {
        return true;
      }
    }

    // Exact referral code match
    if (pCode && cleanRaw === pCode) return true;
    if (pId && cleanRaw === pId) return true;

    // Without prefix comparison (e.g. ASH772 vs REF-ASH772)
    if (pCodeNoPrefix && cleanNoPrefix && (pCodeNoPrefix === cleanNoPrefix || pCodeNoPrefix === cleanRaw || cleanNoPrefix === pCode)) {
      return true;
    }

    // Substring / contains match
    if (pCode && (cleanRaw.includes(pCode) || pCode.includes(cleanRaw))) return true;
    if (pCodeNoPrefix && cleanNoPrefix && (cleanRaw.includes(pCodeNoPrefix) || pCodeNoPrefix.includes(cleanNoPrefix))) return true;
    if (pId && (cleanRaw.includes(pId) || pId.includes(cleanRaw))) return true;

    // Email match
    if (pEmail && cleanLower === pEmail) return true;

    // Phone matching (full phone or 10-digit / last 6-digit match)
    if (cleanDigits.length >= 6 && pPhone) {
      if (
        pPhone === cleanDigits ||
        pPhone.endsWith(cleanDigits) ||
        cleanDigits.endsWith(pPhone) ||
        (pPhone.length >= 6 && cleanDigits.length >= 6 && pPhone.slice(-6) === cleanDigits.slice(-6))
      ) {
        return true;
      }
    }

    // Name match
    if (pName && (cleanRaw === pName || cleanNoPrefix === pName.replace(/[^A-Z0-9]/g, ''))) return true;
  }

  // 3. Check direct commissions log if provided
  if (commissionsList && commissionsList.length > 0) {
    const hasJoinComm = commissionsList.some(
      (c) => c.userId === parent.id && c.sourceUserId === child.id && (c.level === 1 || c.gameId === 'signup_bonus')
    );
    if (hasJoinComm) return true;
  }

  return false;
}

/**
 * Searches a user array for a matching referrer by referralCode, userId, phone, email, or name
 */
export function findReferrerInList(
  referralInput: string | null | undefined,
  usersList: User[],
  excludeUserId?: string
): User | null {
  if (!referralInput || !usersList || usersList.length === 0) return null;

  const cleanRaw = extractReferralCode(referralInput);
  if (!cleanRaw || cleanRaw.length < 2) return null;

  const cleanNoPrefix = cleanRaw.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '');
  const digitsOnly = cleanRaw.replace(/\D/g, '');
  const cleanLower = String(referralInput).trim().toLowerCase();

  return (
    usersList.find((u) => {
      if (!u || (excludeUserId && u.id === excludeUserId)) return false;

      const uId = (u.id || '').trim().toUpperCase();
      const uCode = (u.referralCode || '').trim().toUpperCase();
      const uCodeNoPrefix = uCode.replace(/^REF-?/, '').replace(/[^A-Z0-9]/g, '');
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toUpperCase();

      // 1. Direct referralCode or user ID exact match
      if (uCode && (uCode === cleanRaw || uCodeNoPrefix === cleanNoPrefix)) return true;
      if (uId && uId === cleanRaw) return true;

      // 2. Substring matches
      if (uCode && (cleanRaw.includes(uCode) || uCode.includes(cleanRaw))) return true;
      if (uCodeNoPrefix && cleanNoPrefix && (cleanRaw.includes(uCodeNoPrefix) || uCodeNoPrefix.includes(cleanRaw))) return true;
      if (uId && (cleanRaw.includes(uId) || uId.includes(cleanRaw))) return true;

      // 3. Phone matching
      if (digitsOnly.length >= 6 && uPhone) {
        if (
          uPhone === digitsOnly ||
          uPhone.endsWith(digitsOnly) ||
          digitsOnly.endsWith(uPhone) ||
          (uPhone.length >= 6 && digitsOnly.length >= 6 && uPhone.slice(-6) === digitsOnly.slice(-6))
        ) {
          return true;
        }
      }

      // 4. Email match
      if (uEmail && cleanLower === uEmail) return true;

      // 5. Name match
      if (uName && (cleanRaw === uName || cleanNoPrefix === uName.replace(/[^A-Z0-9]/g, ''))) return true;

      return false;
    }) || null
  );
}

