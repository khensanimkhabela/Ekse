/**
 * Real South African rights/compliance bodies artists should register
 * with to protect their work and get paid what they're owed. Names and
 * domains verified via web search (2026-08) rather than assumed — getting
 * this wrong in a "protect your work" context would be worse than useless.
 */
export type ComplianceBody = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  relevantFor: string[]; // artist categories (lib/data.ts's CATEGORIES) this matters most for
  url: string;
};

export const COMPLIANCE_BODIES: ComplianceBody[] = [
  {
    id: "samro",
    name: "SAMRO",
    fullName: "Southern African Music Rights Organisation",
    description:
      "Collects and distributes royalties when your music is performed publicly or broadcast — radio, TV, live venues, streaming services and more.",
    relevantFor: ["Music"],
    url: "https://www.samro.org.za/",
  },
  {
    id: "capasso",
    name: "CAPASSO",
    fullName: "Composers, Authors and Publishers Association",
    description:
      "Collects mechanical royalties — money earned when your music is reproduced, e.g. Spotify streams, downloads, CDs and YouTube.",
    relevantFor: ["Music"],
    url: "https://www.capasso.co.za/",
  },
  {
    id: "sampra",
    name: "SAMPRA",
    fullName: "South African Music Performance Rights Association",
    description:
      "Administers needletime rights — royalties owed to performers and session musicians when a recording is played publicly or broadcast.",
    relevantFor: ["Music"],
    url: "https://www.sampra.org.za/",
  },
  {
    id: "risa",
    name: "RiSA",
    fullName: "Recording Industry of South Africa",
    description: "Issues official ISRC codes for your recordings and represents the recording industry on anti-piracy issues.",
    relevantFor: ["Music"],
    url: "https://www.risa.org.za/",
  },
  {
    id: "dalro",
    name: "DALRO",
    fullName: "Dramatic, Artistic and Literary Rights Organisation",
    description:
      "Licenses and collects royalties for literary, dramatic and artistic works — scripts, poetry, choreography, visual art and more.",
    relevantFor: ["Drama", "Poetry", "Dance", "Art", "Media"],
    url: "https://dalro.co.za/",
  },
  {
    id: "cipc",
    name: "CIPC",
    fullName: "Companies and Intellectual Property Commission",
    description:
      "The government body for registering trademarks, copyright, patents and designs — and for registering a business/company if you're trading under a name.",
    relevantFor: ["All"],
    url: "https://iponline.cipc.co.za/",
  },
  {
    id: "sars",
    name: "SARS",
    fullName: "South African Revenue Service",
    description:
      "Register as a provisional taxpayer once you're earning from your work — see the Wallet page for an estimate of what you'll owe.",
    relevantFor: ["All"],
    url: "https://www.sars.gov.za/",
  },
];
