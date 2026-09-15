/**
 * Contact details shown on /contact.
 * Replace every placeholder value before launch.
 */
export const contact = {
  /** Public support inbox */
  email: "customers@kamgol.store",
  /** Human-readable phone (shown in UI) */
  phoneDisplay: "+2349127826298",
  /**
   * Nigeria E.164 without leading + (digits only).
   * Used for tel: and https://wa.me/ links.
   * Example: 2348012345678
   */
  phoneE164: "2349127826298",
  /** Instagram username without @ */
  instagramHandle: "kamgol_access",
  /** Physical store / office address (shown on /contact) */
  address: "15, Owo street, Off Layi Oyekanmi street, Ilasamaja, Mushin, Lagos",
} as const;

export const contactLinks = {
  mailto: `mailto:${contact.email}`,
  tel: `tel:+${contact.phoneE164}`,
  whatsapp: `https://wa.me/${contact.phoneE164}`,
  instagram: `https://www.instagram.com/${contact.instagramHandle}/`,
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
} as const;
