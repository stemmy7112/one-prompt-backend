import { Key, AlertCircle, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { EnvVar } from "@shared/schema";

interface EnvVarsListProps {
  envVars: EnvVar[];
}

export function EnvVarsList({ envVars }: EnvVarsListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyEnvFormat = async () => {
    const envContent = envVars
      .map((v) => `${v.name}=${v.example || "your_value_here"}`)
      .join("\n");
    await navigator.clipboard.writeText(envContent);
  };

  const copyVarName = async (name: string, index: number) => {
    await navigator.clipboard.writeText(name);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (envVars.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <span>No environment variables required</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Environment Variables
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyEnvFormat}
          data-testid="button-copy-all-env"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy All
        </Button>
      </div>
      <div className="space-y-3">
        {envVars.map((envVar, index) => (
          <div
            key={envVar.name}
            className="flex items-start gap-4 p-4 bg-card border rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-sm font-semibold">{envVar.name}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyVarName(envVar.name, index)}
                  data-testid={`button-copy-env-${envVar.name}`}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                {envVar.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{envVar.description}</p>
              {envVar.example && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Example:</span>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {envVar.example}
                  </code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
