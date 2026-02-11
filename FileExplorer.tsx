import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@shared/schema";

interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
  file?: GeneratedFile;
}

interface FileExplorerProps {
  files: GeneratedFile[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function buildFileTree(files: GeneratedFile[]): FileNode[] {
  const root: FileNode[] = [];
  
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      
      let existing = current.find((n) => n.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          path,
          isFolder: !isLast,
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        };
        current.push(existing);
      }
      
      if (!isLast && existing.children) {
        current = existing.children;
      }
    }
  }
  
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }));
  };
  
  return sortNodes(root);
}

function FileTreeNode({
  node,
  depth = 0,
  selectedFile,
  onSelectFile,
  expandedFolders,
  toggleFolder,
}: {
  node: FileNode;
  depth?: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case "js":
      case "jsx":
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case "json":
        return <FileCode className="h-4 w-4 text-orange-500" />;
      case "css":
        return <FileCode className="h-4 w-4 text-purple-500" />;
      case "html":
        return <FileCode className="h-4 w-4 text-red-500" />;
      case "md":
        return <FileCode className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileCode className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left rounded-md transition-colors hover-elevate",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (node.isFolder) {
            toggleFolder(node.path);
          } else {
            onSelectFile(node.path);
          }
        }}
        data-testid={`file-node-${node.path.replace(/\//g, "-")}`}
      >
        {node.isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, selectedFile, onSelectFile }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const folders = new Set<string>();
    files.forEach((file) => {
      const parts = file.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
    });
    return folders;
  });
  
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  const tree = buildFileTree(files);
  
  return (
    <div className="py-2 overflow-y-auto">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
}
