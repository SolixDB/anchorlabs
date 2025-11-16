import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Info, Network } from "lucide-react";
import { useState } from "react";

interface RPCSelectorProps {
  currentRpcUrl: string;
  onRpcChange: (url: string) => void;
}

const PRESET_RPCS = [
  { name: "Mainnet", url: "https://api.mainnet-beta.solana.com" },
  { name: "Devnet", url: "https://api.devnet.solana.com" },
  { name: "Testnet", url: "https://api.testnet.solana.com" },
];

export const RPCSelector: React.FC<RPCSelectorProps> = ({
  currentRpcUrl,
  onRpcChange,
}) => {
  const [customRpc, setCustomRpc] = useState(currentRpcUrl);
  const [open, setOpen] = useState(false);

  const handlePresetClick = (url: string) => {
    setCustomRpc(url);
    onRpcChange(url);
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customRpc && customRpc.trim()) {
      onRpcChange(customRpc.trim());
      setOpen(false);
    }
  };

  const getCurrentNetwork = () => {
    // First check if it matches a preset exactly
    const preset = PRESET_RPCS.find((rpc) => rpc.url === currentRpcUrl);
    if (preset) {
      return preset.name;
    }

    // If not a preset, check URL content for network type
    const url = currentRpcUrl.toLowerCase();
    if (url.includes("mainnet")) return "Mainnet";
    if (url.includes("devnet")) return "Devnet";
    if (url.includes("testnet")) return "Testnet";
    return "Custom";
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">RPC:</span>
            <Badge variant="secondary" className="font-normal">
              {getCurrentNetwork()}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Select RPC Endpoint</h4>
              <div className="space-y-2">
                {PRESET_RPCS.map((rpc) => (
                  <Button
                    key={rpc.url}
                    variant={currentRpcUrl === rpc.url ? "default" : "outline"}
                    className="w-full justify-between"
                    onClick={() => handlePresetClick(rpc.url)}
                  >
                    <span>{rpc.name}</span>
                    {currentRpcUrl === rpc.url && <Check className="h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-rpc">Custom RPC URL</Label>
              <Input
                id="custom-rpc"
                placeholder="https://your-rpc-url.com"
                value={customRpc}
                onChange={(e) => setCustomRpc(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCustomApply}
                className="w-full"
                size="sm"
                disabled={
                  !customRpc ||
                  customRpc.trim() === "" ||
                  customRpc === currentRpcUrl
                }
              >
                Apply Custom RPC
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" side="bottom" align="end">
            <p className="text-sm">
              This only changes the instruction execution environment, not the
              global program connection
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};