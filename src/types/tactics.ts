// Centralized tactics-related types

import { AssetDetails } from './asset';

export interface Tactic {
  id: string;
  analysis_name: string;
  location: string;
  status: string;
  site_id?: string | number;
  site?: { id: string | number; name: string };
  asset_details: AssetDetails;
  company: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export type CreateTacticRequest = Omit<Tactic, 'id' | 'created_at' | 'updated_at'>;