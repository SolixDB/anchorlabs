"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Code,
  FileCode,
  Plus,
  Trash2,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  Wand2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateTestFromStore, type PDASeeds, type SeedDefinition } from "@/lib/prompt";

export default function TestGeneration() {
  const [pdas, setPdas] = useState<Record<string, { seeds: SeedDefinition[]; description: string }>>({});
  const [currentPdaName, setCurrentPdaName] = useState("");
  const [currentPdaDesc, setCurrentPdaDesc] = useState("");
  const [currentSeeds, setCurrentSeeds] = useState<SeedDefinition[]>([]);
  const [tokenProgram, setTokenProgram] = useState<'spl-token' | 'spl-token-2022' | null>(null);
  const [specialReqs, setSpecialReqs] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [dependencies, setDependencies] = useState<{ required: string[]; optional: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const addSeed = () => {
    setCurrentSeeds([...currentSeeds, { type: "string", value: "" }]);
  };

  const updateSeed = (index: number, field: keyof SeedDefinition, value: string | number) => {
    const newSeeds = [...currentSeeds];
    newSeeds[index] = { ...newSeeds[index], [field]: value };
    setCurrentSeeds(newSeeds);
  };

  const removeSeed = (index: number) => {
    setCurrentSeeds(currentSeeds.filter((_, i) => i !== index));
  };

  const addPda = () => {
    if (!currentPdaName || currentSeeds.length === 0) return;
    setPdas({
      ...pdas,
      [currentPdaName]: {
        seeds: currentSeeds,
        description: currentPdaDesc || "PDA account"
      }
    });
    setCurrentPdaName("");
    setCurrentPdaDesc("");
    setCurrentSeeds([]);
  };

  const removePda = (name: string) => {
    const newPdas = { ...pdas };
    delete newPdas[name];
    setPdas(newPdas);
  };

  const generateTests = async () => {
    if (Object.keys(pdas).length === 0) {
      setError("Please add at least one PDA configuration");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const result = await generateTestFromStore(
        pdas as PDASeeds,
        {
          tokenProgram,
          specialRequirements: specialReqs || undefined
        }
      );

      setGeneratedCode(result.testCode);
      setDependencies(result.dependencies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tests");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTest = () => {
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-test.ts";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-10 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Wand2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">AI Test Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Generate comprehensive Anchor test files with AI-powered intelligence
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* PDA Configuration */}
          <motion.div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  PDA Configuration
                </CardTitle>
                <CardDescription>
                  Define your Program Derived Addresses and their seeds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>PDA Name</Label>
                  <Input
                    placeholder="e.g., dataAccount, vaultAccount"
                    value={currentPdaName}
                    onChange={(e) => setCurrentPdaName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of this PDA"
                    value={currentPdaDesc}
                    onChange={(e) => setCurrentPdaDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seeds</Label>
                    <Button size="sm" variant="outline" onClick={addSeed}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Seed
                    </Button>
                  </div>

                  <AnimatePresence>
                    {currentSeeds.map((seed, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 items-end"
                      >
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={seed.type}
                            onValueChange={(value) => updateSeed(index, "type", value)}
                          >
                            <SelectTrigger>
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
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">
                            {seed.type === "publicKey" ? "Source" : "Value"}
                          </Label>
                          <Input
                            placeholder={seed.type === "publicKey" ? "e.g., user, mint" : "Value"}
                            value={seed.type === "publicKey" ? seed.source || "" : seed.value || ""}
                            onChange={(e) =>
                              updateSeed(
                                index,
                                seed.type === "publicKey" ? "source" : "value",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSeed(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Button
                  className="w-full"
                  onClick={addPda}
                  disabled={!currentPdaName || currentSeeds.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add PDA
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Context */}
          <motion.div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Additional Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Token Program (Optional)</Label>
                  <Select
                    value={tokenProgram || "none"}
                    onValueChange={(value) =>
                      setTokenProgram(value === "none" ? null : value as 'spl-token' | 'spl-token-2022')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="spl-token">SPL Token</SelectItem>
                      <SelectItem value="spl-token-2022">SPL Token 2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Special Requirements</Label>
                  <Textarea
                    placeholder="e.g., Uses token accounts for staking, requires admin signature..."
                    value={specialReqs}
                    onChange={(e) => setSpecialReqs(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview & Actions Panel */}
        <div className="space-y-6">
          {/* PDAs List */}
          <motion.div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Configured PDAs
                  <Badge variant="secondary">{Object.keys(pdas).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {Object.entries(pdas).length === 0 ? (
                    <motion.div
                      className="text-sm text-muted-foreground text-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      No PDAs configured yet
                    </motion.div>
                  ) : (
                    Object.entries(pdas).map(([name, config]) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-start justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="font-medium text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.description}
                          </div>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {config.seeds.map((seed, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {seed.type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removePda(name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generate Button */}
          <motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full h-14 text-lg"
                size="lg"
                onClick={generateTests}
                disabled={isGenerating || Object.keys(pdas).length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Tests...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Tests with AI
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">Error</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {error}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Output */}
          <AnimatePresence>
            {generatedCode && (
              <motion.div

                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-green-500/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Generated Test File
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadTest}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dependencies && (
                      <div className="space-y-2">
                        <Label className="text-xs">Dependencies</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[...dependencies.required, ...dependencies.optional].map((dep: string) => (
                            <Badge key={dep} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-96">
                        <code>{generatedCode}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}