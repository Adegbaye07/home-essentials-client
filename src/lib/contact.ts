/** Placeholder contact details — replace before launch. */
export const contact = {
  email: "customers@example.com",
  phoneDisplay: "00000000000",
  /** Nigeria E.164 without leading + (for tel: and wa.me). */
  phoneE164: "2340000000000",
  instagramHandle: "homeessentials_by_kamgol",
} as const;

export const contactLinks = {
  mailto: `mailto:${contact.email}`,
  tel: `tel:+${contact.phoneE164}`,
  whatsapp: `https://wa.me/${contact.phoneE164}`,
  instagram: `https://www.instagram.com/${contact.instagramHandle}/`,
} as const;
