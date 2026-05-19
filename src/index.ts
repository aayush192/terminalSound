import * as vscode from "vscode";
import * as path from "path";
import player from "play-sound";

const sound = player();

type Severity = "error" | "warning" | "none";

let previousSeverity: Severity = "none";
let debounceTimer: NodeJS.Timeout | undefined;

function play(file: string) {
  sound.play(path.join(__dirname, "../public/sounds", file), (err) => {
    if (err) console.error(`Failed to play sound: ${err}`);
  });
}

function getWorstSeverity(): Severity {
  let hasWarning = false;

  for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
    for (const d of diagnostics) {
      if (d.severity === vscode.DiagnosticSeverity.Error) return "error";
      if (d.severity === vscode.DiagnosticSeverity.Warning) hasWarning = true;
    }
  }

  return hasWarning ? "warning" : "none";
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.languages.onDidChangeDiagnostics(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentSeverity = getWorstSeverity();

      if (currentSeverity !== previousSeverity) {
        if (currentSeverity === "error") play("error.mp3");
        else if (currentSeverity === "warning") play("warning.mp3");
        else if (previousSeverity !== "none") return;

        previousSeverity = currentSeverity;
      }
    }, 500);
  });

  const terminalDisposable = vscode.window.onDidEndTerminalShellExecution(
    (e) => {
      if (e.exitCode === undefined) return;
      if (e.exitCode === 1) play("terminalError.mp3");
      if (e.exitCode === 0) play("terminalSuccess.mp3");
    }
  );

  context.subscriptions.push(disposable,terminalDisposable);
}

export function deactivate() {
  if (debounceTimer) clearTimeout(debounceTimer);
}
