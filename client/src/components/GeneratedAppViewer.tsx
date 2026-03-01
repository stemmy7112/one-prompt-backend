import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from "./FileExplorer";
import { CodeBlock } from "./CodeBlock";
import { EnvVarsList } from "./EnvVarsList";
import { DeploymentInstructions } from "./DeploymentInstructions";
import { Button } from "@/components/ui/button";
import { Download, Code, Key, Rocket, FileCode } from "lucide-react";
import type { GeneratedFile, EnvVar } from "@shared/schema";

interface GeneratedAppViewerProps {
  appName: string;
  description: string;
  files: GeneratedFile[];
  envVars: EnvVar[];
  deploymentInstructions: string;
}

export function GeneratedAppViewer({
  appName,
  description,
  files,
  envVars,
  deploymentInstructions,
}: GeneratedAppViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    files.length > 0 ? files[0].path : null
  );
  const [activeTab, setActiveTab] = useState("files");

  const selectedFileData = files.find((f) => f.path === selectedFile);

  const downloadProject = () => {
    const content = JSON.stringify({ files, envVars, deploymentInstructions }, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/\s+/g, "-")}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{appName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button onClick={downloadProject} variant="outline" data-testid="button-download-project">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
              <FileCode className="h-4 w-4" />
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="env" className="gap-2" data-testid="tab-env">
              <Key className="h-4 w-4" />
              Environment ({envVars.length})
            </TabsTrigger>
            <TabsTrigger value="deploy" className="gap-2" data-testid="tab-deploy">
              <Rocket className="h-4 w-4" />
              Deploy
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="files" className="flex-1 m-0 flex">
          <div className="w-64 border-r bg-muted/30 overflow-y-auto">
            <FileExplorer
              files={files}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
            />
          </div>
          <div className="flex-1 overflow-auto p-4">
            {selectedFileData ? (
              <CodeBlock
                code={selectedFileData.content}
                language={selectedFileData.language}
                filename={selectedFileData.path}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to view its contents
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="env" className="flex-1 m-0 p-6 overflow-auto">
          <EnvVarsList envVars={envVars} />
        </TabsContent>

        <TabsContent value="deploy" className="flex-1 m-0 p-6 overflow-auto">
          <DeploymentInstructions instructions={deploymentInstructions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
