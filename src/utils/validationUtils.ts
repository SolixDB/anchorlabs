import { IdlInstruction } from "@coral-xyz/anchor/dist/cjs/idl";

export const validateArgs = (
  instruction: IdlInstruction | undefined,
  args: Record<string, unknown>
): boolean => {
  if (!instruction) return false;
  
  return instruction.args.every(
    (arg) => args[arg.name] !== undefined && args[arg.name] !== ""
  );
};

export const validateAccounts = (
  instruction: IdlInstruction | undefined,
  accounts: Record<string, string>
): boolean => {
  if (!instruction) return false;
  
  const requiredAccounts = instruction.accounts.filter(
    (acc) => !("optional" in acc && acc.optional)
  );
  
  return requiredAccounts.every(
    (acc) => accounts[acc.name] !== undefined && accounts[acc.name] !== ""
  );
};

export const isFormValid = (
  instruction: IdlInstruction | undefined,
  args: Record<string, unknown>,
  accounts: Record<string, string>
): boolean => {
  return validateArgs(instruction, args) && validateAccounts(instruction, accounts);
};