import { Rocket, ExternalLink, Terminal } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

interface DeploymentInstructionsProps {
  instructions: string;
}

export function DeploymentInstructions({ instructions }: DeploymentInstructionsProps) {
  const sections = parseInstructions(instructions);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Rocket className="h-5 w-5" />
        Deployment Instructions
      </h3>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {sections.map((section, index) => (
          <div key={index} className="mb-6">
            {section.type === "heading" && (
              <h4 className="text-base font-semibold mt-4 mb-2 flex items-center gap-2">
                {section.content}
              </h4>
            )}
            {section.type === "text" && (
              <p className="text-muted-foreground">{section.content}</p>
            )}
            {section.type === "code" && (
              <CodeBlock code={section.content} language="bash" />
            )}
            {section.type === "list" && (
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                {section.items?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Section {
  type: "heading" | "text" | "code" | "list";
  content: string;
  items?: string[];
}

function parseInstructions(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split("\n");
  let currentCode: string[] = [];
  let inCode = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith("```")) {
      if (inCode) {
        sections.push({ type: "code", content: currentCode.join("\n") });
        currentCode = [];
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      currentCode.push(line);
      continue;
    }

    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      sections.push({ type: "heading", content: trimmed.replace(/^#+\s*/, "") });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const lastSection = sections[sections.length - 1];
      if (lastSection?.type === "list") {
        lastSection.items?.push(trimmed.replace(/^[-*]\s*/, ""));
      } else {
        sections.push({ 
          type: "list", 
          content: "", 
          items: [trimmed.replace(/^[-*]\s*/, "")] 
        });
      }
    } else if (trimmed.length > 0) {
      sections.push({ type: "text", content: trimmed });
    }
  }

  return sections;
}
