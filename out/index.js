import * as vscode from "vscode";
import * as path from "path";
import player from "play-sound";
const sound = player();
let previousSeverity = "none";
let debounceTimer;
function play(file) {
    sound.play(path.join(__dirname, "../public/sounds", file), (err) => {
        if (err)
            console.error(`Failed to play sound: ${err}`);
    });
}
function getWorstSeverity() {
    let hasWarning = false;
    for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
        for (const d of diagnostics) {
            if (d.severity === vscode.DiagnosticSeverity.Error)
                return "error";
            if (d.severity === vscode.DiagnosticSeverity.Warning)
                hasWarning = true;
        }
    }
    return hasWarning ? "warning" : "none";
}
export function activate(context) {
    const disposable = vscode.languages.onDidChangeDiagnostics(() => {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const currentSeverity = getWorstSeverity();
            if (currentSeverity !== previousSeverity) {
                if (currentSeverity === "error")
                    play("error.mp3");
                else if (currentSeverity === "warning")
                    play("warning.mp3");
                else if (previousSeverity !== "none")
                    play("success.mp3");
                previousSeverity = currentSeverity;
            }
        }, 500);
    });
    context.subscriptions.push(disposable);
}
export function deactivate() {
    if (debounceTimer)
        clearTimeout(debounceTimer);
}
