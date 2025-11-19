"use client";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { AnimatePresence, motion } from "framer-motion";
import { Code, Loader2, Rocket, Terminal, WalletIcon, Zap, Save, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountInput } from "@/components/instruction/AccountInput";
import { ArgumentInput } from "@/components/instruction/ArgumentInput";
import {
  ErrorToast,
  SuccessToast,
} from "@/components/instruction/NotificationToasts";
import ProgramNotFound from "@/components/ProgramNotFound";
import { RPCSelector } from "@/components/RPCSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import { useInstructionForm } from "@/hooks/useInstructionForm";
import { usePDAManager } from "@/hooks/usePDAManager";
import useProgramStore from "@/stores/programStore";
import useTestSuiteStore from "@/stores/testSuiteStore";
import { TransactionResult } from "@/types";
import { resolveType } from "@/utils/argProcessor";
import { formatInstructionName, formatInstructions } from "@/utils/instructionUtils";
import { executeTransaction } from "@/utils/transactionExecutor";
import { isFormValid } from "@/utils/validationUtils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

function detectClusterFromUrl(rpcUrl: string): string {
  const url = rpcUrl.toLowerCase();
  
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  if (url.includes("mainnet-beta") || url.includes("mainnet")) return "mainnet-beta";
  if (url.includes("localhost") || url.includes("127.0.0.1")) return "localnet";
  
  return "custom";
}

export default function InstructionBuilderPage() {
  const { program, programDetails } = useProgramStore();
  const { suites, addTestCase, createSuite } = useTestSuiteStore();
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet);
  const { publicKey, sendTransaction } = useWallet();

  // Separate RPC state for instruction execution
  const [executionRpcUrl, setExecutionRpcUrl] = useState<string>("");

  // Initialize execution RPC from program details
  useEffect(() => {
    if (programDetails && !executionRpcUrl) {
      setExecutionRpcUrl(programDetails.rpcUrl);
    }
  }, [programDetails, executionRpcUrl]);

  // Connection for instruction execution (separate from program connection)
  const executionConnection = useMemo(() => {
    if (executionRpcUrl) {
      return new Connection(executionRpcUrl);
    }
    return null;
  }, [executionRpcUrl]);

  const [selectedIx, setSelectedIx] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [testCaseName, setTestCaseName] = useState("");
  const [selectedSuiteForSave, setSelectedSuiteForSave] = useState<string>("");

  const instructions = program?.idl?.instructions;
  const formattedInstructions = useMemo(
    () => (instructions ? formatInstructions(instructions) : []),
    [instructions]
  );

  const instruction = useMemo(
    () => instructions?.find((ix) => ix.name === selectedIx),
    [instructions, selectedIx]
  );

  const { args, accounts, handleArgChange, handleAccountChange } =
    useInstructionForm({
      instruction,
      programTypes: programDetails?.types,
    });

  const pdaManager = usePDAManager({
    program,
    onAccountChange: handleAccountChange,
  });

  const formValid = isFormValid(instruction, args, accounts);

  // Get suites for current program
  const currentProgramSuites = suites.filter(
    (s) => s.programId === programDetails?.programId
  );

  const initialSelectedIx = useMemo(
    () => (formattedInstructions.length > 0 ? formattedInstructions[0].name : ""),
    [formattedInstructions]
  );

  useEffect(() => {
    if (initialSelectedIx && !selectedIx) {
      setSelectedIx(initialSelectedIx);
    }
  }, [initialSelectedIx, selectedIx]);

  const handleRpcChange = async (newRpcUrl: string) => {
    try {
      // Just update the local execution RPC, don't touch program connection
      setExecutionRpcUrl(newRpcUrl);
      
      const newCluster = detectClusterFromUrl(newRpcUrl);
      
      toast.success("Execution RPC Updated!", {
        description: `Instructions will now execute on ${newCluster} network`,
      });
    } catch (err) {
      console.error("RPC update error:", err);
      toast.error("RPC Update Error", {
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  };

  const handleSaveTestCase = () => {
    if (!testCaseName.trim()) {
      toast.error("Please enter a test case name");
      return;
    }

    if (!instruction) {
      toast.error("No instruction selected");
      return;
    }

    let suiteId = selectedSuiteForSave;

    // Create new suite if "new" is selected
    if (selectedSuiteForSave === "new") {
      suiteId = createSuite("New Test Suite", programDetails?.programId || "");
    }

    if (!suiteId) {
      toast.error("Please select or create a suite");
      return;
    }

    // Add test case to suite
    addTestCase(suiteId, {
      name: testCaseName,
      instruction: instruction.name,
      args,
      accounts,
    });

    toast.success("Test case saved!", {
      description: `Added to suite successfully`,
    });

    // Reset dialog
    setTestCaseName("");
    setSelectedSuiteForSave("");
    setSaveDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!program || !instruction || !publicKey || !executionConnection) {
      setError("Program, instruction, wallet, or connection not available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await executeTransaction({
        program,
        instruction,
        args,
        accounts,
        connection: executionConnection, // Use the separate execution connection
        publicKey,
        sendTransaction,
        programTypes: programDetails?.types,
      });

      setResult(txResult);
      setShowResult(true);
      toast.success("Transaction sent", {
        description: "Your transaction was successfully sent to the network.",
      });
    } catch (err) {
      console.error("Transaction failed:", err);
      if (err instanceof Error) {
        setError(err.message || "An unknown error occurred");
        setShowError(true);
        toast.error("Transaction failed", {
          description: err.message || "An unknown error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!program || !programDetails) {
    return <ProgramNotFound />;
  }

  if (!instructions || instructions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-64"
      >
        <p className="text-muted-foreground">
          No instructions found in the program IDL.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="space-y-6">
        <motion.div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 12,
                  delay: 0.1,
                }}
                className="rounded-lg bg-primary/10 p-2"
              >
                <Zap className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Instruction Builder
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute instructions from the {programDetails?.name || "selected"}{" "}
                  program
                </p>
              </div>
            </div>

            {/* RPC Selector for Execution Environment */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RPCSelector
                currentRpcUrl={executionRpcUrl}
                onRpcChange={handleRpcChange}
              />
            </motion.div>
          </div>
        </motion.div>

        {formattedInstructions.length > 0 ? (
          <motion.div>
            <Tabs
              value={selectedIx}
              onValueChange={setSelectedIx}
              defaultValue={initialSelectedIx}
              className="w-full"
            >
              <div className="overflow-x-auto">
                <TabsList className="inline-flex h-auto p-1">
                  {formattedInstructions.map((ix, index) => (
                    <motion.div
                      key={ix.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                    >
                      <TabsTrigger
                        value={ix.name}
                        className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
                      >
                        {ix.displayName}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </div>

              {formattedInstructions.map((formattedIx) => {
                const currentInstruction = instructions?.find(
                  (ix) => ix.name === formattedIx.name
                );

                if (!currentInstruction) return null;

                return (
                  <TabsContent
                    key={currentInstruction.name}
                    value={currentInstruction.name}
                    className="mt-4 flex flex-col flex-1 overflow-hidden"
                  >
                    <AnimatePresence mode="wait">
                      {selectedIx === currentInstruction.name && (
                        <motion.div
                          initial={{ y: 10 }}
                          animate={{ y: 0 }}
                          exit={{ y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="w-full flex flex-col flex-1 overflow-hidden">
                            <CardHeader className="flex-shrink-0">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-xl font-semibold">
                                    {formatInstructionName(currentInstruction.name)}
                                  </CardTitle>
                                  {currentInstruction.docs &&
                                    currentInstruction.docs[0] && (
                                      <CardDescription className="mt-1.5">
                                        {currentInstruction.docs[0]}
                                      </CardDescription>
                                    )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {currentInstruction.args.length} Args
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {currentInstruction.accounts.length} Accounts
                                    </Badge>
                                  </div>
                                </div>

                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex-shrink-0 flex gap-2">
                                        {/* Save to Test Suite Button */}
                                        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="lg"
                                              disabled={!formValid || !publicKey}
                                              className="gap-2 px-4"
                                            >
                                              <Save className="h-4 w-4" />
                                              Save Test
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Save Test Case</DialogTitle>
                                              <DialogDescription>
                                                Save this instruction configuration to a test suite
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="test-name">Test Case Name</Label>
                                                <Input
                                                  id="test-name"
                                                  placeholder="e.g., Initialize with admin"
                                                  value={testCaseName}
                                                  onChange={(e) => setTestCaseName(e.target.value)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor="suite-select">Select Test Suite</Label>
                                                <Select
                                                  value={selectedSuiteForSave}
                                                  onValueChange={setSelectedSuiteForSave}
                                                >
                                                  <SelectTrigger id="suite-select">
                                                    <SelectValue placeholder="Choose a suite" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="new">
                                                      <div className="flex items-center gap-2">
                                                        <Plus className="h-4 w-4" />
                                                        Create New Suite
                                                      </div>
                                                    </SelectItem>
                                                    {currentProgramSuites.map((suite) => (
                                                      <SelectItem key={suite.id} value={suite.id}>
                                                        {suite.name}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <Button
                                                onClick={handleSaveTestCase}
                                                className="w-full"
                                                disabled={!testCaseName.trim() || !selectedSuiteForSave}
                                              >
                                                Save Test Case
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>

                                        {/* Execute Button */}
                                        <Button
                                          onClick={handleSubmit}
                                          disabled={!formValid || isLoading || !publicKey}
                                          size="lg"
                                          className="gap-2 px-6 font-semibold shadow-md"
                                        >
                                          {isLoading ? (
                                            <>
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              Executing...
                                            </>
                                          ) : !publicKey ? (
                                            <>
                                              <WalletIcon className="h-4 w-4" />
                                              Connect Wallet
                                            </>
                                          ) : (
                                            <>
                                              <Rocket className="h-4 w-4" />
                                              Execute
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </TooltipTrigger>
                                    {!publicKey ? (
                                      <TooltipContent>
                                        <p>Connect your wallet to execute.</p>
                                      </TooltipContent>
                                    ) : !formValid ? (
                                      <TooltipContent>
                                        <p>Please fill in all required fields.</p>
                                      </TooltipContent>
                                    ) : null}
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6 min-h-0">
                              {/* Arguments Section */}
                              {currentInstruction.args.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  <div className="flex items-center mb-4">
                                    <Code className="h-5 w-5 mr-2 text-primary" />
                                    <h3 className="text-lg font-medium">Arguments</h3>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {currentInstruction.args.map((arg, index) => {
                                      const resolvedType = resolveType(
                                        arg.type,
                                        programDetails?.types
                                      );
                                      return (
                                        <ArgumentInput
                                          key={arg.name}
                                          name={arg.name}
                                          type={arg.type}
                                          value={args[arg.name]}
                                          onChange={(value) =>
                                            handleArgChange(arg.name, value)
                                          }
                                          resolvedType={resolvedType}
                                          index={index}
                                        />
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}

                              {currentInstruction.args.length > 0 &&
                                currentInstruction.accounts.length > 0 && (
                                  <Separator className="my-6" />
                                )}

                              {/* Accounts Section */}
                              {currentInstruction.accounts.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  <div className="flex items-center mb-4">
                                    <Terminal className="h-5 w-5 mr-2 text-primary" />
                                    <h3 className="text-lg font-medium">Accounts</h3>
                                  </div>
                                  <div className="space-y-4">
                                    {currentInstruction.accounts.map((account, index) => (
                                      <AccountInput
                                        key={account.name}
                                        name={account.name}
                                        value={accounts[account.name] || ""}
                                        onChange={(value) =>
                                          handleAccountChange(account.name, value)
                                        }
                                        account={account}
                                        index={index}
                                        publicKey={publicKey}
                                        pdaDialogOpen={pdaManager.pdaDialogOpen}
                                        onPdaDialogChange={pdaManager.setPdaDialogOpen}
                                        pdaSeeds={pdaManager.pdaSeeds}
                                        onAddPdaSeed={pdaManager.addPdaSeed}
                                        onRemovePdaSeed={pdaManager.removePdaSeed}
                                        onUpdatePdaSeed={pdaManager.updatePdaSeed}
                                        onDerivePda={() =>
                                          pdaManager.derivePDAForAccount(account.name)
                                        }
                                      />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                );
              })}
            </Tabs>
          </motion.div>
        ) : (
          <Card className="flex items-center justify-center h-[200px]">
            <CardContent>
              <p className="text-muted-foreground">
                No instructions available to display in tabs.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success & Error Notifications */}
        {result && showResult && (
          <SuccessToast
            result={result}
            rpcUrl={executionRpcUrl}
            onClose={() => setShowResult(false)}
          />
        )}
        {error && showError && (
          <ErrorToast error={error} onClose={() => setShowError(false)} />
        )}
      </div>
    </motion.div>
  );
}