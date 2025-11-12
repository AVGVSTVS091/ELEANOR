
import { MembershipTier, LicenseToken } from '../types';

/**
 * LicenseService
 * 
 * Manages membership tiers, JWT validation, and feature locking.
 */
export class LicenseService {
  private static currentTier: MembershipTier = MembershipTier.Lite;
  private static token: LicenseToken | null = null;

  static initialize() {
    // Load license from secure storage (simulated here with localStorage for web)
    const savedTier = localStorage.getItem('app_tier');
    if (savedTier) {
      this.currentTier = savedTier as MembershipTier;
    }
  }

  static getTier(): MembershipTier {
    return this.currentTier;
  }

  static updateTier(tier: MembershipTier) {
    this.currentTier = tier;
    localStorage.setItem('app_tier', tier);
    console.log(`LicenseService: Membership updated to ${tier}`);
  }

  static isFeatureEnabled(featureName: string): boolean {
    // Logic to check if feature is allowed in currentTier
    if (this.currentTier === MembershipTier.Plus) return true;
    if (this.currentTier === MembershipTier.Pro && featureName !== 'advanced_analytics') return true;
    // Lite restrictions
    const liteFeatures = ['basic_crm', 'local_storage'];
    return liteFeatures.includes(featureName);
  }

  static validateToken(tokenString: string): boolean {
    // Stub for JWT signature verification
    // In production, verify signature using public key
    return true;
  }
}
