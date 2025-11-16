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
import { Textarea } from "@/components/ui/textarea";
import useProgramStore from "@/stores/programStore";
import useTestSuiteStore from "@/stores/testSuiteStore";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SaveTestCaseDialogProps {
  instruction: string;
  args: Record<string, unknown>;
  accounts: Record<string, string>;
}

export const SaveTestCaseDialog: React.FC<SaveTestCaseDialogProps> = ({
  instruction,
  args,
  accounts,
}) => {
  const [open, setOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>("");
  const [newSuiteName, setNewSuiteName] = useState("");
  const [isCreatingNewSuite, setIsCreatingNewSuite] = useState(false);
  const [expectedOutcome, setExpectedOutcome] = useState<"success" | "failure">("success");

  const { suites, addTestCase, createSuite } = useTestSuiteStore();
  const { programDetails } = useProgramStore();

  const handleSave = () => {
    if (!testName.trim()) {
      toast.error("Please enter a test name");
      return;
    }

    let suiteId = selectedSuiteId;

    if (isCreatingNewSuite) {
      if (!newSuiteName.trim()) {
        toast.error("Please enter a suite name");
        return;
      }
      suiteId = createSuite(newSuiteName, programDetails?.programId || "");
      toast.success(`Created suite: ${newSuiteName}`);
    }

    if (!suiteId) {
      toast.error("Please select or create a test suite");
      return;
    }

    addTestCase(suiteId, {
      name: testName,
      instruction,
      args,
      accounts,
      expectedOutcome,
      description: description || undefined,
    });

    toast.success("Test case saved!");
    setOpen(false);
    setTestName("");
    setDescription("");
    setNewSuiteName("");
    setIsCreatingNewSuite(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save as Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Test Case</DialogTitle>
          <DialogDescription>
            Save current instruction configuration for later execution
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-name">Test Name*</Label>
            <Input
              id="test-name"
              placeholder="e.g., Initialize with admin"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What does this test do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected-outcome">Expected Outcome</Label>
            <Select value={expectedOutcome} onValueChange={(v: "success" | "failure") => setExpectedOutcome(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test Suite</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingNewSuite(!isCreatingNewSuite)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isCreatingNewSuite ? "Select Existing" : "Create New"}
              </Button>
            </div>

            {isCreatingNewSuite ? (
              <Input
                placeholder="New suite name"
                value={newSuiteName}
                onChange={(e) => setNewSuiteName(e.target.value)}
              />
            ) : (
              <Select value={selectedSuiteId} onValueChange={setSelectedSuiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test suite" />
                </SelectTrigger>
                <SelectContent>
                  {suites
                    .filter((s) => s.programId === programDetails?.programId)
                    .map((suite) => (
                      <SelectItem key={suite.id} value={suite.id}>
                        {suite.name} ({suite.testCases.length} tests)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Test Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};