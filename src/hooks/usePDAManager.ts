// hooks/usePDAManager.ts
import { useState } from "react";
import { Program } from "@coral-xyz/anchor";
import { toast } from "sonner";
import { SeedInput } from "../types";
import { derivePDA, createDefaultSeed } from "@/utils/pdaUtils";

interface UsePDAManagerProps {
  program: Program | null;
  onAccountChange: (accountName: string, value: string) => void;
}

export const usePDAManager = ({ program, onAccountChange }: UsePDAManagerProps) => {
  const [pdaDialogOpen, setPdaDialogOpen] = useState<string | null>(null);
  const [pdaSeeds, setPdaSeeds] = useState<SeedInput[]>([createDefaultSeed(1)]);

  const addPdaSeed = () => {
    setPdaSeeds((prev) => [...prev, createDefaultSeed(prev.length + 1)]);
  };

  const removePdaSeed = (id: string) => {
    if (pdaSeeds.length > 1) {
      setPdaSeeds((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updatePdaSeed = (id: string, field: keyof SeedInput, value: string) => {
    setPdaSeeds((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const derivePDAForAccount = (accountName: string) => {
    if (!program) return;

    try {
      const pda = derivePDA(pdaSeeds, program.programId);
      onAccountChange(accountName, pda.toBase58());
      setPdaDialogOpen(null);
      setPdaSeeds([createDefaultSeed(1)]);
      toast.success("PDA derived and filled!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to derive PDA");
    }
  };

  return {
    pdaDialogOpen,
    setPdaDialogOpen,
    pdaSeeds,
    addPdaSeed,
    removePdaSeed,
    updatePdaSeed,
    derivePDAForAccount,
  };
};