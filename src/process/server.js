import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import { Client } from 'ssh2';

const app = express();
const PORT = process.env.PORT || 3230;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.get("/", (_, res) => {
    res.send('SSH WebSocket Server is running');
});

const sshConnections = new Map();

// Function to clean ANSI escape sequences
function cleanAnsiSequences(text) {
    // Remove ANSI escape sequences (like [?2004h, [?2004l, colors, etc.)
    return text.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '');
}

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`Received message:`, data);

            switch (data.action) {
                case 'connect':
                    connectSSH(ws, data.hostname, data.password);
                    break;
                case 'input':
                    sendSSHInput(ws, data.command);
                    break;
                case 'disconnect':
                    disconnectSSH(ws);
                    break;
                default:
                    if (typeof message === 'string' || data.hostname) {
                        const hostname = data.hostname || message.toString();
                        connectSSH(ws, hostname);
                    } else {
                        ws.send('Unknown action');
                    }
            }
        } catch (error) {
            // If it's not JSON, treat it as a simple hostname
            const hostname = message.toString();
            console.log(`Connecting to: ${hostname}`);
            connectSSH(ws, hostname);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        disconnectSSH(ws);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        disconnectSSH(ws);
    });
});

function connectSSH(ws, hostname, password) {
    disconnectSSH(ws);

    let username = 'root';
    let host = hostname;
    
    if (hostname.includes('@')) {
        const parts = hostname.split('@');
        username = parts[0];
        host = parts[1];
    }

    console.log(`Connecting to SSH: ${username}@${host}`);
    ws.send(`Connecting to ${username}@${host}...\n`);

    const sshClient = new Client();

    sshClient.on('ready', () => {
        console.log('SSH Client ready');
        ws.send(`Connected to ${username}@${host}\n`);
        
        sshClient.shell((err, stream) => {
            if (err) {
                ws.send(`Shell error: ${err.message}\n`);
                return;
            }

            sshConnections.set(ws, { client: sshClient, stream: stream });

            stream.on('close', () => {
                console.log('SSH stream closed');
                ws.send('Connection closed\n');
                disconnectSSH(ws);
            });

            stream.on('data', (data) => {
                const output = data.toString();
                const cleanedOutput = cleanAnsiSequences(output);
                console.log('SSH output:', cleanedOutput);
                ws.send(cleanedOutput);
            });

            stream.stderr.on('data', (data) => {
                const error = data.toString();
                const cleanedError = cleanAnsiSequences(error);
                console.error('SSH stderr:', cleanedError);
                ws.send(`ERROR: ${cleanedError}`);
            });
        });
    });

    sshClient.on('error', (err) => {
        console.error('SSH Client error:', err);
        ws.send(`Connection failed: ${err.message}\n`);
        disconnectSSH(ws);
    });

    sshClient.on('close', () => {
        console.log('SSH Client closed');
        disconnectSSH(ws);
    });

    const connectConfig = {
        host: host,
        port: 22,
        username: username,
        readyTimeout: 30000
    };

    if (password && password.trim()) {
        connectConfig.password = password;
    }

    sshClient.connect(connectConfig);
}

function sendSSHInput(ws, command) {
    const connection = sshConnections.get(ws);
    if (connection && connection.stream) {
        connection.stream.write(command + '\n');
    } else {
        ws.send('ERROR: No active SSH connection\n');
    }
}

function disconnectSSH(ws) {
    const connection = sshConnections.get(ws);
    if (connection) {
        if (connection.stream) {
            connection.stream.end();
        }
        if (connection.client) {
            connection.client.end();
        }
        sshConnections.delete(ws);
    }
}

server.listen(PORT, () => {
    console.log(`SSH WebSocket Server started on port ${PORT}`);
});