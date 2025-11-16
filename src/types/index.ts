export type SeedType = "string" | "publicKey" | "u64" | "u32" | "u16" | "u8";

export interface SeedInput {
  id: string;
  type: SeedType;
  value: string;
  label: string;
}

export interface TransactionResult {
  signature: string;
}

export interface FormattedInstruction {
  name: string;
  displayName: string;
  args: Array<{ name: string; type: unknown }>;
  accounts: Array<{ name: string; [key: string]: unknown }>;
  docs?: string[];
}