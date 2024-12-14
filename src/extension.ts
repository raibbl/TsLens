// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fg from "fast-glob";
import { exec as childProcessExec, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "typescriptlens" is now active!'
  );

  const tsPercentageProvider = new TypeScriptProgressProvider();
  vscode.window.registerTreeDataProvider(
    "typescriptLensView",
    tsPercentageProvider
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "typescriptlens.helloWorld",
    async () => {
      // The code you place here will be executed every time your command is executed
      const percentage = await getTypeScriptPercentage();
      vscode.window.showInformationMessage(
        `TypeScript Percentage: ${percentage.toFixed(2)}%`
      );
    }
  );

  const openFileCommand = vscode.commands.registerCommand(
    "typescriptProgress.openFile",
    (filePath: string) => {
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      // Resolve the absolute file path
      const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const absolutePath = vscode.Uri.file(`${workspaceFolder}/${filePath}`);

      // Open the document
      vscode.workspace.openTextDocument(absolutePath).then(
        (document) => vscode.window.showTextDocument(document),
        (error) => {
          vscode.window.showErrorMessage(
            `Unable to open file: ${filePath}. ${error.message}`
          );
        }
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(openFileCommand);
}

async function scanFiles(
  dir: string
): Promise<{ tsFiles: number; jsFiles: number }> {
  const tsFiles = await fg(["src/**/*.ts", "src/**/*.tsx"], {
    cwd: dir,
    ignore: ["node_modules/**", "dist/**"],
  });
  const jsFiles = await fg(["src/**/*.js", "src/**/*.jsx"], {
    cwd: dir,
    ignore: ["node_modules/**", "dist/**"],
  });

  return { tsFiles: tsFiles.length, jsFiles: jsFiles.length };
}

// This method is called when your extension is deactivated
export function deactivate() {}

class TypeScriptProgressProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | null | void
  > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private percentage: number = 0;
  private mostChangedFiles: { file: string; changes: number }[] = [];

  constructor() {
    this.updatePercentage();

    this.fetchMostChangedFiles();

    const watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{ts,tsx,js,jsx}",
      false, // ignoreCreateEvents
      false, // ignoreChangeEvents
      false // ignoreDeleteEvents
    );

    watcher.onDidChange(() => this.updatePercentage());
    watcher.onDidCreate(() => this.updatePercentage());
    watcher.onDidDelete(() => this.updatePercentage());

    // Clean up the watcher when the extension is deactivated
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      watcher.dispose();
    });
  }

  private async updatePercentage() {
    this.percentage = await getTypeScriptPercentage();
    this._onDidChangeTreeData.fire();
  }

  private async fetchMostChangedFiles(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const workspacePath = workspaceFolders[0].uri.fsPath;

    return new Promise<void>((resolve) => {
      exec(
        `git log --pretty=format: --name-only | grep -E '\\.js$|\\.jsx$' | sort | uniq -c | sort -nr`,
        { cwd: workspacePath },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Error fetching Git history:", stderr);
            resolve();
            return;
          }

          console.log(stdout);
          const filesWithChanges = stdout
            .trim()
            .split("\n")
            .map((line) => {
              const [changes, ...fileParts] = line.trim().split(/\s+/);
              const file = fileParts.join(" ");
              return { file, changes: parseInt(changes, 10) };
            });

          // Filter for existing files
          this.mostChangedFiles = filesWithChanges.filter(({ file }) => {
            const filePath = path.resolve(workspacePath, file);
            return fs.existsSync(filePath);
          });

          resolve();
        }
      );
    });
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TreeItem[] {
    const items: TreeItem[] = [];
    // Add percentage
    items.push(
      new TreeItem(`TypeScript Percentage: ${this.percentage.toFixed(2)}%	`)
    );
    // Add most changed files
    if (this.mostChangedFiles.length > 0) {
      items.push(new TreeItem("Most Changed Files:"));

      this.mostChangedFiles.forEach((file) => {
        items.push(
          (() => {
            const treeItem = new TreeItem(
              `${file.file} (${file.changes} changes)`,
              vscode.TreeItemCollapsibleState.None
            );
            treeItem.command = {
              command: "typescriptProgress.openFile",
              title: "Open File",
              arguments: [file.file],
            };
            return treeItem;
          })()
        );
      });
    } else {
      items.push(
        new TreeItem(
          "No JavaScript files to refactor.",
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    return items;
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
  }
}

async function getTypeScriptPercentage(): Promise<number> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Please open a project to analyze."
    );
    return 0;
  }

  // Use the root folder of the first workspace
  const rootPath = workspaceFolders[0].uri.fsPath;

  try {
    // Call the scanFiles function
    const { tsFiles, jsFiles } = await scanFiles(rootPath);

    // Calculate the percentage
    const totalFiles = tsFiles + jsFiles;
    return totalFiles > 0 ? (tsFiles / totalFiles) * 100 : 0;
  } catch (error) {
    vscode.window.showErrorMessage(`Error analyzing files: ${error}`);
    return 0;
  }
}
