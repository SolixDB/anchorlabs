import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { SeedInput } from "@/types";
import { PDADialog } from "./PDADialog";

interface AccountInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  account: {
    name: string;
    signer?: boolean;
    writable?: boolean;
    optional?: boolean;
    docs?: string[];
    [key: string]: unknown;
  };
  index: number;
  publicKey: PublicKey | null;
  pdaDialogOpen: string | null;
  onPdaDialogChange: (accountName: string | null) => void;
  pdaSeeds: SeedInput[];
  onAddPdaSeed: () => void;
  onRemovePdaSeed: (id: string) => void;
  onUpdatePdaSeed: (id: string, field: keyof SeedInput, value: string) => void;
  onDerivePda: () => void;
}

export const AccountInput: React.FC<AccountInputProps> = ({
  name,
  value,
  onChange,
  account,
  index,
  publicKey,
  pdaDialogOpen,
  onPdaDialogChange,
  pdaSeeds,
  onAddPdaSeed,
  onRemovePdaSeed,
  onUpdatePdaSeed,
  onDerivePda,
}) => {
  const isSignerAccount = ["authority", "payer", "signer"].some((term) =>
    name.toLowerCase().includes(term.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 + index * 0.05 }}
      className="bg-muted/40 p-4 rounded-lg space-y-2.5"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label htmlFor={`account-${name}`} className="font-medium">
          {name}
        </Label>
        <div className="flex gap-1.5">
          {"signer" in account && account.signer && (
            <Badge variant="secondary" className="font-normal text-xs">
              Signer
            </Badge>
          )}
          {"writable" in account && account.writable && (
            <Badge variant="default" className="font-normal text-xs">
              Mutable
            </Badge>
          )}
          {"optional" in account && account.optional && (
            <Badge variant="outline" className="font-normal text-xs">
              Optional
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          id={`account-${name}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${name} public key`}
          className="font-mono text-sm flex-1 transition-all duration-200 focus:shadow-sm h-11"
        />

        <PDADialog
          accountName={name}
          isOpen={pdaDialogOpen === name}
          onOpenChange={(open) => onPdaDialogChange(open ? name : null)}
          seeds={pdaSeeds}
          onAddSeed={onAddPdaSeed}
          onRemoveSeed={onRemovePdaSeed}
          onUpdateSeed={onUpdatePdaSeed}
          onDerive={onDerivePda}
        />

        {publicKey && isSignerAccount && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={() => onChange(publicKey.toString())}
            title="Use connected wallet"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      {"docs" in account && account.docs && account.docs[0] && (
        <p className="text-xs text-muted-foreground mt-1.5">{account.docs[0]}</p>
      )}
    </motion.div>
  );
};