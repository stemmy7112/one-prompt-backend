import { Loader2, Check, Code, Database, FileCode, CreditCard, Settings, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof Code;
  completed: boolean;
  active: boolean;
}

interface GenerationProgressProps {
  currentStep: string;
  completedSteps: string[];
}

const STEPS: Omit<GenerationStep, "completed" | "active">[] = [
  { id: "analyzing", label: "Analyzing prompt", icon: Code },
  { id: "schema", label: "Generating data models", icon: Database },
  { id: "frontend", label: "Building frontend", icon: FileCode },
  { id: "backend", label: "Creating backend", icon: Settings },
  { id: "payments", label: "Wiring payments", icon: CreditCard },
  { id: "finalizing", label: "Finalizing project", icon: Rocket },
];

export function GenerationProgress({ currentStep, completedSteps }: GenerationProgressProps) {
  const steps: GenerationStep[] = STEPS.map((step) => ({
    ...step,
    completed: completedSteps.includes(step.id),
    active: step.id === currentStep,
  }));

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
              step.active && "border-primary bg-primary/5",
              step.completed && "border-green-500/30 bg-green-500/5",
              !step.active && !step.completed && "border-border/50 opacity-50"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
                step.active && "bg-primary text-primary-foreground",
                step.completed && "bg-green-500 text-white",
                !step.active && !step.completed && "bg-muted text-muted-foreground"
              )}
            >
              {step.active ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step.active && "text-foreground",
                step.completed && "text-foreground",
                !step.active && !step.completed && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
