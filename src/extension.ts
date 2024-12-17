// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import {
  getTypeScriptPercentage,
  getMostChangedFiles,
} from "./typescriptUtilites";

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
    "typescriptlens.precentage",
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

  private async fetchMostChangedFiles() {
    this.mostChangedFiles = await getMostChangedFiles();
    this._onDidChangeTreeData.fire();
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
