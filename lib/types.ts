export type Industry =
  | "Logistics"
  | "Manufacturing"
  | "Food and Beverage"
  | "Retail"
  | "Construction"
  | "Professional Services"
  | "Other";

export type HeadcountRange = "under_50" | "50_150" | "150_350" | "350_500";

export interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  egridSubregion: string;
}

export type SectionName =
  | "connections"
  | "scope1"
  | "scope2"
  | "scope3"
  | "social"
  | "governance"
  | "reports";

export type SectionStatus = "not_started" | "in_progress" | "complete";

export interface QBTransaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
}

export interface UtilityMonth {
  locationId: string;
  month: string;
  kwh: number;
  therms: number;
}

export interface Inputs {
  fleet_gasoline_gal?: number | null;
  fleet_diesel_gal?: number | null;
  fleet_propane_gal?: number | null;
  fleet_na?: boolean;
  natgas_therms_override?: number | null;
  natgas_na?: boolean;
  refrigerant_type?: string;
  refrigerant_kg?: number | null;
  refrigerant_na?: boolean;
  equipment_fuel_type?: string;
  equipment_gal?: number | null;
  equipment_na?: boolean;
  scope2_reviewed?: boolean;
  has_recs?: boolean;
  rec_coverage_pct?: number | null;
  rec_certificate_name?: string;
  qb_data_reviewed?: boolean;
  commute_avg_miles?: number | null;
  commute_mode?: string;
  commute_days_in_office?: number | null;
  waste_landfill_tons?: number | null;
  waste_recycled_tons?: number | null;
  waste_composted_tons?: number | null;
  scope3_other_categories?: Record<string, "na" | "industry_average">;
  social_total_employees?: number | null;
  social_new_hires?: number | null;
  social_departures?: number | null;
  social_lost_time_injuries?: number | null;
  social_osha_recordables?: number | null;
  social_near_misses?: number | null;
  social_days_lost?: number | null;
  social_training_hours?: number | null;
  social_demographics_uploaded?: boolean;
  gov_leadership?: Record<string, { womenPct?: number | null; minorityPct?: number | null }>;
  gov_policies?: Record<string, boolean | null>;
  gov_ccpa_compliant?: boolean | null;
  gov_public_privacy_policy?: boolean | null;
  gov_data_breaches?: boolean | null;
}

export interface CalcResult {
  id: string;
  scope: 1 | 2 | 3;
  category: string;
  co2eTons: number;
  factorId: string | null;
  formula: string;
  basis: "measured" | "spend_based" | "estimated";
  marketBasedTons?: number;
}

export interface AuditRow {
  id: string;
  ts: string;
  companyId: string;
  userId: string;
  userName: string;
  section: string;
  field: string;
  prev: string;
  next: string;
  factorId?: string;
  formula?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: Industry | null;
  headcountRange: HeadcountRange | null;
  locations: Location[];
  fiscalYearEndMonth: number | null;
  setupComplete: boolean;
  createdAt: string;
  connections: {
    quickbooks: { connected: boolean; lastSynced: string | null };
    utility: { connected: boolean; lastSynced: string | null };
  };
  qbTransactions: QBTransaction[];
  utilityData: UtilityMonth[];
  inputs: Inputs;
  calcs: CalcResult[];
  sectionStatus: Record<SectionName, SectionStatus>;
  reportGeneratedAt: string | null;
  actionPlan: string[] | null;
}

// User identity is managed by Clerk — we store only the app-level fields
export interface User {
  id: string; // Clerk user ID
  name: string;
  email: string;
  companyId: string;
  createdAt: string;
}

export interface EmissionFactor {
  factor_id: string;
  factor_name: string;
  category: string;
  value: number;
  unit: string;
  source: string;
  source_url: string;
  year_effective: number;
  year_retired: number | null;
}
