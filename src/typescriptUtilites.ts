import * as vscode from "vscode";
import fg from "fast-glob";
import { exec as childProcessExec, exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";

export async function getTypeScriptPercentage(): Promise<number> {
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

const execPromise = util.promisify(exec);

export async function getMostChangedFiles(): Promise<
  { file: string; changes: number }[]
> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return [];

  const workspacePath = workspaceFolders[0].uri.fsPath;

  try {
    const { stdout } = await execPromise(
      `git log --pretty=format: --name-only | grep -E '\\.js$|\\.jsx$' | sort | uniq -c | sort -nr`,
      { cwd: workspacePath }
    );

    const filesWithChanges = stdout
      .trim()
      .split("\n")
      .map((line) => {
        const [changes, ...fileParts] = line.trim().split(/\s+/);
        const file = fileParts.join(" ");
        return { file, changes: parseInt(changes, 10) };
      });

    // Filter for existing files
    return filesWithChanges.filter(({ file }) => {
      const filePath = path.resolve(workspacePath, file);
      return fs.existsSync(filePath);
    });
  } catch (error) {
    console.error("Error fetching Git history:", error);
    return [];
  }
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
