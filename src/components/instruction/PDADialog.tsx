// components/PDADialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Hash } from "lucide-react";
import { SeedInput } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PDADialogProps {
  accountName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  seeds: SeedInput[];
  onAddSeed: () => void;
  onRemoveSeed: (id: string) => void;
  onUpdateSeed: (id: string, field: keyof SeedInput, value: string) => void;
  onDerive: () => void;
}

export const PDADialog: React.FC<PDADialogProps> = ({
  accountName,
  isOpen,
  onOpenChange,
  seeds,
  onAddSeed,
  onRemoveSeed,
  onUpdateSeed,
  onDerive,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-11 px-3 gap-2 font-medium backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-foreground transition-all [.solana_&]:hover:text-white [.solana_&]:hover:[&_*]:text-white"
              >
                <Hash className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Derive PDA</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Derive Program Derived Address for {accountName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Derive PDA for {accountName}</DialogTitle>
          <DialogDescription>
            Configure seeds to derive a Program Derived Address
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <AnimatePresence mode="popLayout">
            {seeds.map((seed, seedIndex) => (
              <motion.div
                key={seed.id}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                layout
                className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Seed {seedIndex + 1}
                  </Label>
                  {seeds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-600"
                      onClick={() => onRemoveSeed(seed.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={seed.type}
                      onValueChange={(value) =>
                        onUpdateSeed(seed.id, "type", value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="publicKey">Public Key</SelectItem>
                        <SelectItem value="u64">u64</SelectItem>
                        <SelectItem value="u32">u32</SelectItem>
                        <SelectItem value="u16">u16</SelectItem>
                        <SelectItem value="u8">u8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      placeholder={
                        seed.type === "string"
                          ? "e.g., account"
                          : seed.type === "publicKey"
                            ? "Base58 address"
                            : "Number"
                      }
                      value={seed.value}
                      onChange={(e) =>
                        onUpdateSeed(seed.id, "value", e.target.value)
                      }
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAddSeed}>
              Add Seed
            </Button>
            <Button
              onClick={onDerive}
              className="flex-1"
              disabled={seeds.some((s) => !s.value.trim())}
            >
              <Hash className="h-4 w-4 mr-2" />
              Derive & Fill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};