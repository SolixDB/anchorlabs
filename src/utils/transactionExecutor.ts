import { TransactionResult } from "@/types";
import { Program } from "@coral-xyz/anchor";
import { IdlInstruction } from "@coral-xyz/anchor/dist/cjs/idl";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { processInstructionArgs } from "./argProcessor";

interface ExecuteTransactionParams {
  program: Program;
  instruction: IdlInstruction;
  args: Record<string, unknown>;
  accounts: Record<string, string>;
  connection: Connection;
  publicKey: PublicKey;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ) => Promise<string>;
  programTypes?: Array<{ name: string; type: unknown }>;
}

export const executeTransaction = async ({
  program,
  instruction,
  args,
  accounts,
  connection,
  publicKey,
  sendTransaction,
  programTypes,
}: ExecuteTransactionParams): Promise<TransactionResult> => {
  // Process arguments
  const processedArgs = processInstructionArgs(instruction, args, programTypes);
  console.log("Final processed args:", processedArgs);

  // Create method builder
  const methodBuilder = program.methods[instruction.name](...processedArgs);

  // Resolve accounts
  const accountsObject: Record<string, PublicKey> = {};

  for (const [name, value] of Object.entries(accounts)) {
    if (value) {
      try {
        accountsObject[name] = new PublicKey(value);
      } catch (err) {
        console.warn(`Invalid public key for account ${name}:`, err);
        throw new Error(`Invalid public key for account "${name}": ${value}`);
      }
    }
  }

  console.log("Accounts object:", accountsObject);

  // Build transaction
  const transaction = await methodBuilder.accounts(accountsObject).transaction();

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  // Send transaction
  const txSignature = await sendTransaction(transaction, connection, {
    skipPreflight: false,
  });

  console.log("Transaction sent with signature:", txSignature);

  // Confirm transaction
  const confirmation = await connection.confirmTransaction({
    signature: txSignature,
    blockhash,
    lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    throw new Error(
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }

  return { signature: txSignature };
};