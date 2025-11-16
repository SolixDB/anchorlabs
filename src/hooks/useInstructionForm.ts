// hooks/useInstructionForm.ts
import { useState, useEffect } from "react";
import { IdlInstruction } from "@coral-xyz/anchor/dist/cjs/idl";
import { initializeArgsForInstruction } from "@/utils/argProcessor";

interface UseInstructionFormProps {
  instruction: IdlInstruction | undefined;
  programTypes?: Array<{ name: string; type: unknown }>;
}

export const useInstructionForm = ({
  instruction,
  programTypes,
}: UseInstructionFormProps) => {
  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [accounts, setAccounts] = useState<Record<string, string>>({});

  // Reset form when instruction changes
  useEffect(() => {
    if (instruction) {
      const initialArgs = initializeArgsForInstruction(instruction, programTypes);
      setArgs(initialArgs);

      const initialAccounts: Record<string, string> = {};
      instruction.accounts.forEach((acc) => {
        initialAccounts[acc.name] = "";
      });
      setAccounts(initialAccounts);
    }
  }, [instruction, programTypes]);

  const handleArgChange = (name: string, value: unknown) => {
    setArgs((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountChange = (name: string, value: string) => {
    setAccounts((prev) => ({ ...prev, [name]: value }));
  };

  return {
    args,
    accounts,
    handleArgChange,
    handleAccountChange,
  };
};