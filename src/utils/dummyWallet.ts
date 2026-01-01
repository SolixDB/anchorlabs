import { AnchorWallet } from "@jup-ag/wallet-adapter";
import { Keypair, PublicKey } from "@solana/web3.js";

/**
 * Creates a dummy wallet for program initialization when no real wallet is connected.
 * This allows the program to be initialized and explored without requiring wallet connection.
 */
export function createDummyWallet(): AnchorWallet {
  // Generate a dummy keypair (not used for signing, just for initialization)
  const dummyKeypair = Keypair.generate();
  
  return {
    publicKey: dummyKeypair.publicKey,
    signTransaction: async (tx) => {
      throw new Error("Dummy wallet cannot sign transactions. Please connect a real wallet to execute transactions.");
    },
    signAllTransactions: async (txs) => {
      throw new Error("Dummy wallet cannot sign transactions. Please connect a real wallet to execute transactions.");
    },
  };
}

