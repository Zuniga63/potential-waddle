export interface CloudinaryPresetResponse {
  name: string;
  unsigned: boolean;
  settings: unknown;
  rate_limit_allowed: number;
  rate_limit_reset_at: Date;
  rate_limit_remaining: number;
}
