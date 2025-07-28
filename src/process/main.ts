import * as path from "path";
import { spawn } from "child_process";
import {
    DataResponse,
    Process,
    Setting,
} from "@nexus-app/nexus-module-builder";
import { BooleanSetting } from "@nexus-app/nexus-module-builder/settings/types";

// These is replaced to the ID specified in export-config.js during export. DO NOT MODIFY.
const MODULE_ID: string = "{EXPORTED_MODULE_ID}";
const MODULE_NAME: string = "{EXPORTED_MODULE_NAME}";
// ---------------------------------------------------
const HTML_PATH: string = path.join(__dirname, "../renderer/index.html");

// If you have an icon, specify the relative path from this file.
// Can be a .png, .jpeg, .jpg, or .svg
// const ICON_PATH: string = path.join(__dirname, "...")

const ICON_PATH: string = undefined;

export default class SSHClientProcess extends Process {
    /**
     *  The constructor. At this point, the renderer may not be fully initialized yet;
     *  therefor do not do any logic important to the renderer and
     *  instead put that logic in initialize().
     */
    public constructor() {
        super({
            moduleID: MODULE_ID,
            moduleName: MODULE_NAME,
            paths: {
                htmlPath: HTML_PATH,
                iconPath: ICON_PATH,
            },
        });
    }

    // The entry point of the module. Will be called once the renderer sends the 'init' signal.
    public async initialize(): Promise<void> {
        super.initialize(); // This should be called.

        this.refreshAllSettings();
        // Request the accent color from the built-in 'Settings' module and send it to the renderer.
        this.requestExternal("nexus.Settings", "get-accent-color").then(
            (value: DataResponse) => {
                this.sendToRenderer("accent-color-changed", value.body);
            }
        );
    }

    // Receive events sent from the renderer.
    public async handleEvent(eventType: string, data: any[]): Promise<any> {
        switch (eventType) {
            case "init": {
                // This is called when the renderer is ready to receive events.
                this.initialize();

                // SSH-Client Process is ready to receive events.
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
                break;
            }

            default: {
                console.info(
                    `[${MODULE_NAME}] Unhandled event: eventType: ${eventType} | data: ${data}`
                );
                break;
            }
        }
    }

    // Add settings/section headers.
    public registerSettings(): (Setting<unknown> | string)[] {
        return [
            "SSH Client Settings",
            new BooleanSetting(this)
                .setDefault(false)
                .setName("Enable SSH Agent Forwarding")
                .setDescription("Allow SSH agent forwarding.")
                .setAccessID("ssh_agent_forwarding"),
        ];
    }

    // Fired whenever a setting is modified.
    public async onSettingModified(
        modifiedSetting: Setting<unknown>
    ): Promise<void> {
        if (modifiedSetting.getAccessID() === "ssh_agent_forwarding") {
            this.sendToRenderer("ssh-agent-forwarding", modifiedSetting.getValue());
        }
    }
}
