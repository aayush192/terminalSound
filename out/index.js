"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const play_sound_1 = __importDefault(require("play-sound"));
const ignoreCommand_1 = require("./constants/ignoreCommand");
const sound = (0, play_sound_1.default)();
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
function activate(context) {
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
                    return;
                previousSeverity = currentSeverity;
            }
        }, 500);
    });
    const terminalDisposable = vscode.window.onDidEndTerminalShellExecution((e) => {
        const command = e.execution.commandLine.value;
        if (ignoreCommand_1.ignoredCommands.some((cmd) => command.startsWith(cmd)))
            return;
        if (e.exitCode === undefined)
            return;
        if (e.exitCode === 1) {
            play("terminalError.mp3");
        }
        if (e.exitCode === 0 && command.includes("git"))
            play("terminalSuccess.mp3");
        return;
    });
    context.subscriptions.push(disposable, terminalDisposable);
}
function deactivate() {
    if (debounceTimer)
        clearTimeout(debounceTimer);
}
