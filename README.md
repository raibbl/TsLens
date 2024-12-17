# TypescriptLens

**Track TypeScript progress and recommend files for refactoring!**

TypescriptLens is a Visual Studio Code extension designed to help you monitor your workspace's progress in transitioning to TypeScript and identify the most frequently changed JavaScript files that might benefit from refactoring.

---

## Features

### 1. TypeScript Progress

Displays the percentage of TypeScript files in your project compared to JavaScript files. Provides a quick way to track your progress in adopting TypeScript.

![TypeScript Progress](https://raw.githubusercontent.com/raibbl/TsLens/refs/heads/main/resources/typescriptPrecentage.gif)

### 2. Most Changed Files

Lists the JavaScript files that are most frequently updated, based on Git history. Suggests files that might benefit from being refactored to TypeScript.

### 3. Quick Navigation

Click on any file in the list to open it directly in the editor for review and refactoring.

![VS Code Side Action](https://raw.githubusercontent.com/raibbl/TsLens/refs/heads/main/resources/SideBarAction.gif)

### 4. Activity Bar Integration

The extension is accessible via the Activity Bar, with an intuitive icon and collapsible sections for a cleaner UI.

---

## Installation

1. Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com).
2. Ensure Git is installed and accessible via your system's `PATH`.

---

## How to Use

1. Open a workspace with JavaScript/TypeScript files.
2. Go to the **TypescriptLens** section in the Activity Bar.
3. View:
   - **TypeScript Progress**: The percentage of TypeScript files.
   - **Most Changed Files**: A list of JavaScript files sorted by change frequency.

---

## Requirements

- **Git**: The extension uses Git logs to identify the most changed files.
- **Node.js**: Required for building and running the extension.

---

## Extension Settings

This extension does not currently add any custom settings. Future updates may include configurable options like:

- Ignored files or directories.
- Customizable sorting for the most changed files.

---

## Known Issues

- The extension may not function correctly in projects without Git initialization.
- Files outside the workspace folder are not included in the analysis.

If you encounter any other issues, please report them on the [GitHub issues page](https://github.com/raibbl/TsLens).

---

## Release Notes

### 0.0.1

- Initial release of TypescriptLens.
- Features:
  - TypeScript progress tracking.
  - Git-based most changed files list.
  - File navigation via the extension view.

---

## Contributing

Contributions are welcome! Check out the [GitHub repository](https://github.com/raibbl/TsLens) to report bugs, suggest features, or contribute code.

---

## Feedback and Support

For questions or feedback, feel free to reach out through the [GitHub repository](https://github.com/raibbl/TsLens).

**Enjoy a more organized migration to TypeScript!**
