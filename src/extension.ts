// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import fg from "fast-glob";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "typescriptlens" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "typescriptlens.helloWorld",
    async () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from TypescriptLens!");

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "No workspace folder is open. Please open a project to analyze."
        );
        return;
      }

      // Use the root folder of the first workspace
      const rootPath = workspaceFolders[0].uri.fsPath;

      try {
        // Call the scanFiles function
        const { tsFiles, jsFiles } = await scanFiles(rootPath);

        // Calculate the percentage
        const totalFiles = tsFiles + jsFiles;
        const tsPercentage = totalFiles > 0 ? (tsFiles / totalFiles) * 100 : 0;

        // Display the results
        vscode.window.showInformationMessage(
          `TypeScript Percentage: ${tsPercentage.toFixed(2)}%`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error analyzing files: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
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
