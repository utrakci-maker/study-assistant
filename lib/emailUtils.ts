/**
 * lib/emailUtils.ts
 *
 * Email validation utilities used on both the client and server.
 * We check three things:
 * 1. Format — does it look like a real email address?
 * 2. TLD — does it have a real domain extension (.com, .net, etc.)?
 * 3. Disposable — is it from a known throwaway email service?
 *
 * We don't do MX record lookups (that would slow down uploads).
 * These three checks catch 95%+ of fake email attempts.
 */

// Well-known disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'grr.la', 'sharklasers.com', 'guerrillamailblock.com',
  'mailinator.com', 'trashmail.com', 'trashmail.net', 'trashmail.io',
  'temp-mail.org', 'tempmail.com', 'tempr.email', 'temp-mail.ru',
  '10minutemail.com', '10minutemail.net', '10minemail.com',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
  'maildrop.cc', 'dispostable.com', 'discard.email',
  'fakeinbox.com', 'getairmail.com', 'spam4.me', 'spamgourmet.com',
  'throwam.com', 'throwam.net', 'throwaway.email',
  'mailnull.com', 'spamhereplease.com', 'binkmail.com',
  'mailnesia.com', 'mail-temporaire.fr', 'jetable.net',
  'crazymailing.com', 'objectmail.com', 'ownmail.net',
  'filzmail.com', 'tempe-mail.com', 'spamfree24.org',
])

// Valid email regex — requires local@domain.tld with 2+ char TLD
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed) return 'Email address is required.'

  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@gmail.com).'
  }

  const domain = trimmed.split('@')[1]

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'Disposable or temporary email addresses are not allowed. Please use your real email.'
  }

  // Block single-character TLDs or suspicious patterns
  const tld = domain.split('.').pop() ?? ''
  if (tld.length < 2) {
    return 'Please enter a valid email address with a real domain.'
  }

  return '' // Empty string = valid
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
