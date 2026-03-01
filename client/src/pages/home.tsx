import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Send, Wand2, Zap, Code, CreditCard, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GeneratedAppViewer } from "@/components/GeneratedAppViewer";
import { GenerationProgress } from "@/components/GenerationProgress";
import { HistoryList } from "@/components/HistoryList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import type { GeneratedApp, GeneratedFile, EnvVar } from "@shared/schema";

const EXAMPLE_PROMPTS = [
  "A recipe sharing platform where users can submit recipes and vote on their favorites",
  "An AI-powered fitness coaching app that creates personalized workout plans",
  "A mood tracking journal with AI insights and weekly emotional reports",
  "A micro-SaaS for freelancers to track time, invoices, and client projects",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history = [], isLoading: historyLoading } = useQuery<GeneratedApp[]>({
    queryKey: ["/api/apps"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/apps/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
      if (selectedHistoryId && generatedApp?.id === selectedHistoryId) {
        setGeneratedApp(null);
        setSelectedHistoryId(null);
      }
      toast({ title: "App deleted", description: "The generated app has been removed." });
    },
  });

  const handleSelectHistory = async (id: number) => {
    setSelectedHistoryId(id);
    const app = history.find((a) => a.id === id);
    if (app) {
      setGeneratedApp(app);
    }
  };

  const parseSSEEvents = (text: string): { events: any[]; remainder: string } => {
    const events: any[] = [];
    const lines = text.split("\n");
    let remainder = "";
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6);
        if (i === lines.length - 1 && !text.endsWith("\n")) {
          remainder = line;
          break;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          events.push(parsed);
        } catch {
          if (i === lines.length - 1) {
            remainder = line;
            break;
          }
        }
      }
      i++;
    }
    
    return { events, remainder };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Please describe the app you want to create.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setCurrentStep("analyzing");
    setCompletedSteps([]);
    setGeneratedApp(null);
    setSelectedHistoryId(null);

    let completedAppId: number | null = null;
    let streamingAppId: number | null = null;
    let receivedComplete = false;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSSEEvents(buffer);
        buffer = remainder;

        for (const event of events) {
          switch (event.type) {
            case "status":
              setCurrentStep(event.step);
              if (event.completed) {
                setCompletedSteps((prev) => [...prev, event.completed]);
              }
              break;
            case "appInfo":
              if (event.appId) {
                streamingAppId = event.appId;
              }
              break;
            case "files":
              break;
            case "envVars":
              break;
            case "deploymentInstructions":
              break;
            case "complete":
              receivedComplete = true;
              setCompletedSteps((prev) => [...prev, "finalizing"]);
              completedAppId = event.app?.id;
              setGeneratedApp(event.app);
              queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
              break;
            case "error":
              throw new Error(event.message);
          }
        }
      }

      if (!receivedComplete && streamingAppId) {
        const app = await fetch(`/api/apps/${streamingAppId}`).then(r => r.json());
        if (app) {
          setGeneratedApp(app);
          completedAppId = app.id;
          queryClient.invalidateQueries({ queryKey: ["/api/apps"] });
        }
      }

      if (completedAppId || generatedApp) {
        toast({ title: "App generated!", description: "Your production-ready app is complete." });
        setPrompt("");
      } else {
        throw new Error("Generation completed but no app data received");
      }
    } catch (error) {
      toast({ 
        title: "Generation failed", 
        description: error instanceof Error ? error.message : "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep("");
    }
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">One-Prompt AI App Generator</h1>
              <p className="text-xs text-muted-foreground">Generate production-ready apps instantly</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex">
        <aside className="w-80 border-r bg-muted/30 hidden lg:flex lg:flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Generation History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <HistoryList
              apps={history}
              selectedId={selectedHistoryId}
              onSelect={handleSelectHistory}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          {!generatedApp && !isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
                    <Wand2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-3xl font-bold">Create Your App</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Describe your app idea in a single prompt. We'll generate a complete, 
                    production-ready web application with AI integration and payments.
                  </p>
                </div>

                <Card className="p-6">
                  <div className="space-y-4">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Describe your app idea... Be specific about features, target users, and functionality."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none text-base"
                      data-testid="input-prompt"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {prompt.length} characters
                      </span>
                      <Button 
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="gap-2"
                        data-testid="button-generate"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate App
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">Try an example:</p>
                  <div className="grid gap-2">
                    {EXAMPLE_PROMPTS.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => useExamplePrompt(example)}
                        className="text-left p-3 rounded-lg border bg-card text-sm hover-elevate transition-colors flex items-center gap-3"
                        data-testid={`example-prompt-${i}`}
                      >
                        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{example}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-8 border-t">
                  <div className="text-center space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 mx-auto flex items-center justify-center">
                      <Code className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium">Full-Stack</p>
                    <p className="text-xs text-muted-foreground">Frontend + Backend</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 mx-auto flex items-center justify-center">
                      <Zap className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-sm font-medium">AI-Powered</p>
                    <p className="text-xs text-muted-foreground">OpenAI Integration</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 mx-auto flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">Monetized</p>
                    <p className="text-xs text-muted-foreground">Stripe Payments</p>
                  </div>
                </div>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 animate-pulse">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Generating Your App</h2>
                  <p className="text-muted-foreground">
                    This usually takes 30-60 seconds...
                  </p>
                </div>
                <GenerationProgress 
                  currentStep={currentStep} 
                  completedSteps={completedSteps} 
                />
              </div>
            </div>
          ) : generatedApp ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <GeneratedAppViewer
                appName={generatedApp.appName}
                description={generatedApp.description || ""}
                files={generatedApp.files as GeneratedFile[]}
                envVars={generatedApp.envVars as EnvVar[]}
                deploymentInstructions={generatedApp.deploymentInstructions}
              />
              <div className="border-t p-4 flex items-center justify-between bg-muted/30">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedApp(null);
                    setSelectedHistoryId(null);
                  }}
                  data-testid="button-new-app"
                >
                  Generate Another App
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
