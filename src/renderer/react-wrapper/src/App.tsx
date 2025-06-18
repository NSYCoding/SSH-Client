import { useEffect, useState } from "react";
import './App.css';
import { addProcessListener } from './nexus-bridge';

const WS_URL = "ws://localhost:3230";

function App() {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            setMessages((prev) => [...prev, event.data]);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        return () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        const handleMessage = (eventType: string, ...data: any) => {
            console.log("Received from process:", eventType, data);
        };

        const removeListener = addProcessListener(handleMessage);

        return () => {
            window.removeEventListener("message", removeListener);
        };
    }, []);


    return (
        <>
            <div className="container">
                <div className="row1">
                    <input type="text" className='inputHost' placeholder='Enter your hostname (user@UserIP || hostname)' id='hostname' />
                    <label className='hostnameLabel' htmlFor="hostname">Hostname</label>
                </div>
                <div className="row2">
                    <pre id='output'></pre>
                    <input type="text" id='terminalInput' />
                </div>
            </div>
            <div>
                <h1>SSH Output</h1>
                <pre>
                    {messages.map((msg, idx) => (
                        <div key={idx}>{msg}</div>
                    ))}
                </pre>
            </div>
        </>
    )
}

export default App;
