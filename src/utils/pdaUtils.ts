import { SeedInput } from "@/types";
import { PublicKey } from "@solana/web3.js";

export const derivePDA = (
  seeds: SeedInput[],
  programId: PublicKey
): PublicKey => {
  const seedBuffers: Buffer[] = [];

  for (const seed of seeds) {
    if (!seed.value.trim()) {
      throw new Error(`${seed.label} cannot be empty`);
    }

    switch (seed.type) {
      case "string":
        seedBuffers.push(Buffer.from(seed.value));
        break;
      case "publicKey": {
        const pubkey = new PublicKey(seed.value);
        seedBuffers.push(pubkey.toBuffer());
        break;
      }
      case "u64": {
        const num = BigInt(seed.value);
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(num);
        seedBuffers.push(buf);
        break;
      }
      case "u32": {
        const num = parseInt(seed.value);
        const buf = Buffer.alloc(4);
        buf.writeUInt32LE(num);
        seedBuffers.push(buf);
        break;
      }
      case "u16": {
        const num = parseInt(seed.value);
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(num);
        seedBuffers.push(buf);
        break;
      }
      case "u8": {
        const num = parseInt(seed.value);
        const buf = Buffer.alloc(1);
        buf.writeUInt8(num);
        seedBuffers.push(buf);
        break;
      }
    }
  }

  const [pda] = PublicKey.findProgramAddressSync(seedBuffers, programId);
  return pda;
};

export const createDefaultSeed = (index: number = 1): SeedInput => ({
  id: Date.now().toString(),
  type: "string",
  value: "",
  label: `Seed ${index}`,
});