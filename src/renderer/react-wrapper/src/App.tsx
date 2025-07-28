import { useEffect, useState, useRef } from "react";
import './App.css';

const WS_URL = "ws://localhost:3230";

function App() {
    const [messages, setMessages] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [hostname, setHostname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const terminalInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset connection states on page load
        setIsConnected(false);
        setIsConnecting(false);
        setMessages([]);
        
        const connectWebSocket = () => {
            const websocket = new WebSocket(WS_URL);
            
            websocket.onopen = () => {
                console.log("WebSocket connected");
                setWs(websocket);
            };

            websocket.onmessage = (event) => {
                const message = event.data;
                console.log('Received:', message);
                setMessages((prev) => [...prev, message]);
                
                // Check if connection was successful
                if (message.includes('Connected to') || message.includes('SSH Client ready')) {
                    setIsConnecting(false);
                    setIsConnected(true);
                }
                
                if (message.includes('Connection failed') || 
                    message.includes('ERROR:') || 
                    message.includes('Connection closed') ||
                    message.includes('SSH stream closed')) {
                    setIsConnecting(false);
                    setIsConnected(false);
                }
            };

            websocket.onclose = () => {
                console.log("WebSocket disconnected");
                setWs(null);
                setIsConnected(false);
                setIsConnecting(false);
                
                setTimeout(connectWebSocket, 3000);
            };

            websocket.onerror = (error) => {
                console.error("WebSocket error:", error);
                setIsConnecting(false);
                setIsConnected(false);
            };
        };

        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const handleConnect = () => {
        if (hostname.trim() && ws && ws.readyState === WebSocket.OPEN) {
            setIsConnecting(true);
            setMessages([]);
            
            const connectionData = {
                action: 'connect',
                hostname: hostname.trim(),
                password: password.trim()
            };
            
            ws.send(JSON.stringify(connectionData));
            setPassword('');
        }
    };

    const handleDisconnect = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const disconnectData = {
                action: 'disconnect'
            };
            ws.send(JSON.stringify(disconnectData));
        }
        setIsConnected(false);
        setIsConnecting(false);
    };

    const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && isConnected && ws && ws.readyState === WebSocket.OPEN) {
            const input = (e.target as HTMLInputElement).value;
            
            const inputData = {
                action: 'input',
                command: input
            };
            
            ws.send(JSON.stringify(inputData));
            (e.target as HTMLInputElement).value = '';
        }
    };

    const getButtonText = () => {
        if (isConnecting) return 'Connecting...';
        if (isConnected) return 'Disconnect';
        return 'Connect';
    };

    const getButtonClass = () => {
        if (isConnecting) return 'connect';
        if (isConnected) return 'disconnect';
        return 'connect';
    };

    return (
        <>
            <div className="container">
                <div className="row1">
                    <input 
                        type="text" 
                        className='inputHost' 
                        placeholder='Enter your hostname (user@hostname)' 
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                        disabled={isConnected || isConnecting || !ws}
                    />
                    <div className="password-container">
                        <input 
                            type={showPassword ? "text" : "password"}
                            className='inputPassword' 
                            placeholder='Enter password (optional)' 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isConnected || isConnecting || !ws}
                        />
                        <button 
                            type="button"
                            className="show-password"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isConnected || isConnecting || !ws}
                        >
                            {showPassword ? 'X' : 'O'}
                        </button>
                    </div>
                    <button 
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        className={getButtonClass()}
                        disabled={!hostname.trim() || isConnecting || !ws}
                    >
                        {getButtonText()}
                    </button>
                </div>
                <div className="row2">
                    <pre id='output'>
                        {!ws && (
                            <div>
                                Connecting to WebSocket server...
                            </div>
                        )}
                        {ws && messages.length === 0 && !isConnecting && (
                            <div>
                                Enter hostname and click Connect to start SSH session...
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx}>{msg}</div>
                        ))}
                    </pre>
                    <input 
                        ref={terminalInputRef}
                        type="text" 
                        id='terminalInput'
                        placeholder={isConnected ? 'Type commands here and press Enter...' : 'Connect to SSH first'}
                        disabled={!isConnected}
                        onKeyDown={handleTerminalInput}
                    />
                </div>
            </div>
        </>
    )
}

export default App;
