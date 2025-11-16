"use client";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  Play,
  Plus,
  Trash2,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import useTestSuiteStore, { TestCase } from "@/stores/testSuiteStore";
import { executeTransaction } from "@/utils/transactionExecutor";

interface TestResult {
  testCaseId: string;
  status: "pending" | "running" | "success" | "failure";
  signature?: string;
  error?: string;
  duration?: number;
}

export default function TestSuitesPage() {
  const { program, programDetails } = useProgramStore();
  const { suites, deleteSuite, deleteTestCase, createSuite } = useTestSuiteStore();
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet);
  const { publicKey, sendTransaction } = useWallet();

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const connection = useMemo(() => {
    if (programDetails) {
      return new Connection(programDetails.rpcUrl);
    }
  }, [programDetails]);

  const currentProgramSuites = suites.filter(
    (s) => s.programId === programDetails?.programId
  );

  const selectedSuite = currentProgramSuites.find((s) => s.id === selectedSuiteId);

  const handleCreateSuite = () => {
    if (!newSuiteName.trim()) {
      toast.error("Please enter a suite name");
      return;
    }
    const id = createSuite(newSuiteName, programDetails?.programId || "");
    setSelectedSuiteId(id);
    setNewSuiteName("");
    setCreateDialogOpen(false);
    toast.success("Test suite created!");
  };

  const runSingleTest = async (testCase: TestCase) => {
    if (!program || !publicKey || !connection) {
      toast.error("Program or wallet not available");
      return;
    }

    const instruction = program.idl.instructions.find(
      (ix) => ix.name === testCase.instruction
    );

    if (!instruction) {
      toast.error(`Instruction ${testCase.instruction} not found`);
      return;
    }

    setTestResults((prev) => ({
      ...prev,
      [testCase.id]: { testCaseId: testCase.id, status: "running" },
    }));

    const startTime = Date.now();

    try {
      const result = await executeTransaction({
        program,
        instruction,
        args: testCase.args,
        accounts: testCase.accounts,
        connection,
        publicKey,
        sendTransaction,
        programTypes: programDetails?.types,
      });

      const duration = Date.now() - startTime;
      setTestResults((prev) => ({
        ...prev,
        [testCase.id]: {
          testCaseId: testCase.id,
          status: "success",
          signature: result.signature,
          duration,
        },
      }));
    } catch (err) {
      const duration = Date.now() - startTime;
      setTestResults((prev) => ({
        ...prev,
        [testCase.id]: {
          testCaseId: testCase.id,
          status: "failure",
          error: err instanceof Error ? err.message : "Unknown error",
          duration,
        },
      }));
    }
  };

  const runAllTests = async () => {
    if (!selectedSuite || !program || !publicKey || !connection) {
      toast.error("Cannot run tests");
      return;
    }

    setIsRunning(true);
    setTestResults({});

    for (const testCase of selectedSuite.testCases) {
      await runSingleTest(testCase);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    toast.success("Test suite execution completed!");
  };

  const getResultStats = () => {
    const results = Object.values(testResults);
    return {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      failure: results.filter((r) => r.status === "failure").length,
      running: results.filter((r) => r.status === "running").length,
    };
  };

  const stats = getResultStats();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Test Suites
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Execute instruction sequences in one click
              </p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Suite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Test Suite</DialogTitle>
                <DialogDescription>
                  Create a new test suite for {programDetails?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="suite-name">Suite Name</Label>
                  <Input
                    id="suite-name"
                    placeholder="e.g., Integration Tests"
                    value={newSuiteName}
                    onChange={(e) => setNewSuiteName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateSuite} className="w-full">
                  Create Suite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suite List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Your Test Suites</CardTitle>
              <CardDescription>
                {currentProgramSuites.length} suite(s) for this program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentProgramSuites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No test suites yet. Create one to get started!
                </p>
              ) : (
                currentProgramSuites.map((suite) => (
                  <div
                    key={suite.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedSuiteId === suite.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                      }`}
                    onClick={() => setSelectedSuiteId(suite.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{suite.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {suite.testCases.length} test(s)
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSuite(suite.id);
                          if (selectedSuiteId === suite.id) {
                            setSelectedSuiteId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Test Cases & Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedSuite ? selectedSuite.name : "Select a Suite"}
                  </CardTitle>
                  {selectedSuite && (
                    <CardDescription>
                      {selectedSuite.testCases.length} test case(s)
                    </CardDescription>
                  )}
                </div>
                {selectedSuite && selectedSuite.testCases.length > 0 && (
                  <Button
                    onClick={runAllTests}
                    disabled={isRunning || !publicKey}
                    className="gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run All
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSuite ? (
                <div className="text-center py-12 text-muted-foreground">
                  Select a test suite to view its test cases
                </div>
              ) : selectedSuite.testCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No test cases yet. Add tests from the Instruction Builder!
                </div>
              ) : (
                <>
                  {stats.total > 0 && (
                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline">Total: {stats.total}</Badge>
                      <Badge variant="default" className="bg-green-500">
                        Success: {stats.success}
                      </Badge>
                      <Badge variant="destructive">Failure: {stats.failure}</Badge>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Instruction</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSuite.testCases.map((testCase) => {
                        const result = testResults[testCase.id];
                        return (
                          <TableRow key={testCase.id}>
                            <TableCell className="font-medium">
                              {testCase.name}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {testCase.instruction}
                              </code>
                            </TableCell>
                            <TableCell>
                              {result ? (
                                <Badge
                                  variant={
                                    result.status === "success"
                                      ? "default"
                                      : result.status === "failure"
                                        ? "destructive"
                                        : "outline"
                                  }
                                  className="gap-1"
                                >
                                  {result.status === "running" && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  {result.status === "success" && (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  {result.status === "failure" && (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {result.status}
                                  {result.duration && ` (${result.duration}ms)`}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Not run</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => runSingleTest(testCase)}
                                disabled={
                                  isRunning ||
                                  !publicKey ||
                                  result?.status === "running"
                                }
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  deleteTestCase(selectedSuite.id, testCase.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}