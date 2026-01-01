import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Network } from "lucide-react";
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
          <Button 
            variant="outline" 
            size="default"
            className="gap-2.5 h-10 px-4 backdrop-blur-sm bg-background/80 border-border/50 hover:bg-background/90 transition-all"
          >
            <Network className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Network:</span>
            <Badge 
              variant="secondary" 
              className="font-medium text-xs px-2 py-0.5 bg-primary/10 text-primary border-0"
            >
              {getCurrentNetwork()}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 backdrop-blur-md bg-background/95 border-border/50 shadow-xl" align="end">
          <div className="space-y-5">
            <div>
              <h4 className="font-semibold text-sm mb-3 text-foreground">Select RPC Endpoint</h4>
              <div className="space-y-2">
                {PRESET_RPCS.map((rpc) => (
                  <Button
                    key={rpc.url}
                    variant={currentRpcUrl === rpc.url ? "default" : "outline"}
                    className="w-full justify-between h-10 font-medium"
                    onClick={() => handlePresetClick(rpc.url)}
                  >
                    <span>{rpc.name}</span>
                    {currentRpcUrl === rpc.url && <Check className="h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label htmlFor="custom-rpc" className="text-sm font-medium">Custom RPC URL</Label>
              <Input
                id="custom-rpc"
                placeholder="https://your-rpc-url.com"
                value={customRpc}
                onChange={(e) => setCustomRpc(e.target.value)}
                className="font-mono text-sm h-10"
              />
              <Button
                onClick={handleCustomApply}
                className="w-full h-10 font-medium"
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
    </div>
  );
};