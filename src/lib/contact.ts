/**
 * Contact details shown on /contact.
 * Replace every placeholder value before launch.
 */
export const contact = {
  /** Public support inbox */
  email: "REPLACE_WITH_SUPPORT_EMAIL",
  /** Human-readable phone (shown in UI) */
  phoneDisplay: "REPLACE_WITH_PHONE",
  /**
   * Nigeria E.164 without leading + (digits only).
   * Used for tel: and https://wa.me/ links.
   * Example: 2348012345678
   */
  phoneE164: "2340000000000",
  /** Instagram username without @ */
  instagramHandle: "homeessentials_by_kamgol",
} as const;

export const contactLinks = {
  mailto: `mailto:${contact.email}`,
  tel: `tel:+${contact.phoneE164}`,
  whatsapp: `https://wa.me/${contact.phoneE164}`,
  instagram: `https://www.instagram.com/${contact.instagramHandle}/`,
} as const;

/** True when default placeholders are still in place. */
export function contactNeedsSetup(): boolean {
  return (
    contact.email.startsWith("REPLACE_") ||
    contact.phoneDisplay.startsWith("REPLACE_") ||
    contact.phoneE164 === "2340000000000"
  );
}
