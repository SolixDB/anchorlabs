import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getExplorerUrl } from "@/components/TransactionTable";
import { CheckCircle2, Copy, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { TransactionResult } from "@/types";

interface SuccessToastProps {
  result: TransactionResult;
  rpcUrl: string;
  onClose: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  result,
  rpcUrl,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ y: -20, scale: 0.95 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-6 right-6 z-50 w-full max-w-sm"
    >
      <Card className="border border-green-500/30 bg-green-500/10 backdrop-blur-xl shadow-xl rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center text-base font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            Transaction Successful
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4 text-green-500" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Signature:</span>
                <Button variant="ghost" size="sm" className="h-6 gap-1" asChild>
                  <Link
                    href={getExplorerUrl(result.signature, "solana", rpcUrl)}
                    target="_blank"
                  >
                    <span className="text-xs">View Transaction</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="p-3 rounded-md overflow-x-auto flex items-center gap-2 border border-white/20 bg-white/5">
                <code className="text-xs break-all flex-1">
                  {result.signature}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(result.signature);
                    toast.success("Signature copied to clipboard");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  return (
    <motion.div
      initial={{ y: -20, scale: 0.95 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="fixed top-6 right-6 z-50 w-full max-w-sm"
    >
      <Card className="border border-red-500/30 bg-red-500/10 backdrop-blur-xl shadow-xl rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center text-base font-medium text-destructive">
            <XCircle className="h-4 w-4 mr-2 text-destructive" />
            Transaction Failed
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-md border border-white/20 bg-white/5">
            <div className="flex items-start justify-between gap-2">
              <code className="text-xs break-all text-destructive">
                {error}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(error);
                  toast.success("Error copied to clipboard");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};