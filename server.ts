import { WebSocketServer } from "ws";
import express, { Request, Response } from "express";
import http from "http";
import { spawn } from 'node:child_process';

const app = express();
const PORT = process.env.PORT || 3230;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.get("/", (_: Request, res: Response) => {
    res.send('loaded');
});

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        console.log(`Received message: ${message}`);
        const sshProcess = spawn('ssh', [`${message}`, '-p', '22']);
        sshProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            ws.send(data.toString());
        });
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});