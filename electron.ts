import "electron";
// This file is to indicate that Electron is being used and SHOULD NOT be modified.

// App code
import { spawn } from "child_process";
import path from "path";

const serverPath = path.join(__dirname, "server.ts");
const serverProcess = spawn("npx", ["ts-node", serverPath], {
    stdio: "inherit",
    shell: true,
});
serverProcess.on("error", (error) => {
    console.error("Failed to start server:", error);
});
serverProcess.on("exit", (code) => {
    console.log(`Server exited with code ${code}`);
});
