export type RegionConfig = {
  key: string;
  countryCode: string;
  currency: string;
  locale: string;
  dataRegion: string;
  primaryMarket: boolean;
  privacyLabel: string;
};

export const regionConfigs: Record<string, RegionConfig> = {
  canada: { key: 'canada', countryCode: 'CA', currency: 'CAD', locale: 'en-CA', dataRegion: 'canada', primaryMarket: true, privacyLabel: 'Canada-first data configuration' },
  unitedKingdom: { key: 'unitedKingdom', countryCode: 'GB', currency: 'GBP', locale: 'en-GB', dataRegion: 'customer-selected', primaryMarket: false, privacyLabel: 'Regional deployment required before launch' },
  unitedStates: { key: 'unitedStates', countryCode: 'US', currency: 'USD', locale: 'en-US', dataRegion: 'customer-selected', primaryMarket: false, privacyLabel: 'Regional deployment required before launch' },
  australia: { key: 'australia', countryCode: 'AU', currency: 'AUD', locale: 'en-AU', dataRegion: 'customer-selected', primaryMarket: false, privacyLabel: 'Regional deployment required before launch' },
  uae: { key: 'uae', countryCode: 'AE', currency: 'AED', locale: 'en-AE', dataRegion: 'customer-selected', primaryMarket: false, privacyLabel: 'Regional deployment required before launch' },
};

export const platformDefaults = {
  region: regionConfigs.canada,
  productMarket: 'SMB',
  minTargetEmployees: 10,
  maxTargetEmployees: 250,
  supportedSmbCeiling: 499,
  vendorNeutral: true,
  materialActionsRequireApproval: true,
  customerDataModelTrainingDefault: false,
  autonomousExternalCommunicationsDefault: false,
  autonomousFinancialCommitmentsDefault: false,
};
