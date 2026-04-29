export const CATEGORIES = {
  trades_licensed: {
    label: 'Trades (Licensed)',
    icon: 'HardHat',
    subcategories: ['electrical', 'plumbing', 'hvac', 'roofing', 'general_contractor'],
    requiresLicense: true,
  },
  trades_unlicensed: {
    label: 'Trades (Unlicensed)',
    icon: 'Hammer',
    subcategories: ['landscaping', 'painting', 'handyman', 'cleaning', 'moving'],
    requiresLicense: false,
  },
  digital: {
    label: 'Digital Work',
    icon: 'Monitor',
    subcategories: ['web_dev', 'graphic_design', 'social_media', 'photography', 'video'],
    requiresLicense: false,
  },
  services: {
    label: 'Personal Services',
    icon: 'UserCheck',
    subcategories: ['tutoring', 'pet_care', 'personal_training', 'catering', 'event_planning'],
    requiresLicense: false,
  },
  civic: {
    label: 'Civic Projects',
    icon: 'Building',
    subcategories: ['community_organizing', 'nonprofit_support', 'translation', 'mentoring'],
    requiresLicense: false,
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const TIER_NAMES = ['Open', 'Peer Verified', 'Credentialed', 'Established', 'Guild Master'] as const;
export const TIER_COLORS = ['gray', 'blue', 'green', 'amber', 'purple'] as const;

export interface TierRequirement {
  tier: number;
  name: string;
  jobs: number;
  qualityScore: number;
  peerAttestations: number;
  licenseRequired: boolean;
  jobAccess: string;
  bondCoverage: string;
}

export const TIER_REQUIREMENTS: TierRequirement[] = [
  { tier: 0, name: 'Open', jobs: 0, qualityScore: 0, peerAttestations: 0, licenseRequired: false, jobAccess: 'Under $500', bondCoverage: 'None' },
  { tier: 1, name: 'Peer Verified', jobs: 5, qualityScore: 0, peerAttestations: 2, licenseRequired: false, jobAccess: 'Up to $2,500', bondCoverage: 'DAO covers $2,500' },
  { tier: 2, name: 'Credentialed', jobs: 10, qualityScore: 400, peerAttestations: 3, licenseRequired: true, jobAccess: 'Up to $25,000', bondCoverage: 'DAO covers $25,000' },
  { tier: 3, name: 'Established', jobs: 25, qualityScore: 450, peerAttestations: 0, licenseRequired: true, jobAccess: 'Above $25K, city RFPs', bondCoverage: 'Full coverage' },
  { tier: 4, name: 'Guild Master', jobs: 50, qualityScore: 480, peerAttestations: 0, licenseRequired: true, jobAccess: 'GC functions', bondCoverage: 'Pooled bond' },
];

export function computeStartingTier(hasLicense: boolean, hasHistory: boolean): number {
  if (hasLicense) return 0;
  return 0;
}

export function getTierColor(tier: number): string {
  const colors = ['bg-gray-100 text-gray-700 border-gray-300', 'bg-blue-100 text-blue-700 border-blue-300', 'bg-green-100 text-green-700 border-green-300', 'bg-amber-100 text-amber-700 border-amber-300', 'bg-purple-100 text-purple-700 border-purple-300'];
  return colors[tier] || colors[0];
}

export function getTierBadgeClasses(tier: number): string {
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierColor(tier)}`;
}
