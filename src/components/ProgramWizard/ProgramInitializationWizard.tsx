"use client";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { useJsonStore } from "@/stores/jsonStore";
import { useAnchorWallet } from "@jup-ag/wallet-adapter";
import { CheckCircle2, FileJson, Database, X, Code2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { syne } from "@/fonts/fonts";
import IdlConfigurationStep from "./IdlConfigurationStep";
import NetworkConnectionStep from "./NetworkConnectionStep";
import InitializationReviewStep from "./InitializationReviewStep";
import useProgramStore from "@/stores/programStore";

interface WizardStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "IDL Configuration",
    icon: <FileJson className="h-5 w-5" />,
    description: "Configure your Anchor program IDL",
  },
  {
    id: 2,
    title: "Network Connection",
    icon: <Database className="h-5 w-5" />,
    description: "Set up RPC endpoint",
  },
];

interface ProgramInitializationWizardProps {
  onComplete?: () => void;
}

export default function ProgramInitializationWizard({
  onComplete,
}: ProgramInitializationWizardProps) {
  const [activeStep, setActiveStep] = useState(1);
  const { reset: resetJsonStore, jsonData, isValid } = useJsonStore();
  const wallet = useAnchorWallet();
  const { programDetails } = useProgramStore();
  const router = useRouter();

  useEffect(() => {
    resetJsonStore();
  }, [resetJsonStore]);

  const handleBackToLanding = () => {
    router.push("/");
  };

  const navigateToStep = (stepId: number) => {
    if (stepId === 2 && (!jsonData || !isValid)) {
      return;
    }
    setActiveStep(stepId);
  };

  const canNavigateToStep = (stepId: number): boolean => {
    if (stepId === 1) return true;
    if (stepId === 2) return Boolean(jsonData && isValid);
    return false;
  };

  return (
    <div className="mx-auto flex h-screen w-full max-w-5xl flex-col p-6">
      {/* Header with Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className={`${syne} text-lg font-bold`}>AnchorLabs</h1>
            <p className="text-xs text-muted-foreground">Setup</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToLanding}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Back to Home
        </Button>
      </motion.div>
      
      <div className="mb-4">
        <Stepper value={activeStep} className="items-start gap-4">
          {WIZARD_STEPS.map(({ id, title, icon }) => {
            const isActive = activeStep === id;
            const isCompleted = activeStep > id;
            const isNavigable = canNavigateToStep(id);

            return (
              <StepperItem key={id} step={id} className="flex-1">
                <StepperTrigger
                  className="w-full flex-col items-start gap-2 rounded data-[active]:font-medium data-[active]:text-foreground"
                  onClick={() => isNavigable && navigateToStep(id)}
                  disabled={!isNavigable}
                >
                  <StepperIndicator
                    asChild
                    className={`h-1.5 w-full transition-colors ${isActive || isCompleted ? "bg-primary" : "bg-border"
                      }`}
                  >
                    <span className="sr-only">{id}</span>
                  </StepperIndicator>
                  <div className="space-y-0.5 flex items-center gap-2 justify-center mt-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {icon}
                    </span>
                    <StepperTitle
                      className={`transition-colors ${isActive
                        ? "text-primary font-medium"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                        }`}
                    >
                      {title}
                    </StepperTitle>
                  </div>
                </StepperTrigger>
              </StepperItem>
            );
          })}
        </Stepper>
      </div>

      <div className="flex-1 flex overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        {activeStep === 1 && (
          <IdlConfigurationStep onNext={() => navigateToStep(2)} />
        )}
        {activeStep === 2 && (
          <NetworkConnectionStep
            onNext={() => {
              // Auto-initialize and go to dashboard
              if (onComplete) {
                onComplete();
              }
            }}
            onBack={() => navigateToStep(1)}
          />
        )}
      </div>
    </div>
  );
}