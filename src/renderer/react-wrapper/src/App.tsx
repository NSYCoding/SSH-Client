import { useEffect, useState } from 'react'
import './App.css'
import { addProcessListener, sendToProcess } from './nexus-bridge';


function App() {
    const [count, setCount] = useState(0);
    const [isSampleSettingOn, setSampleSetting] = useState(false);

    useEffect(() => {
        const listener = addProcessListener((eventType: string, data: any[]) => {
            switch (eventType) {
                case "sample-setting": {
                    setSampleSetting(data[0]);
                    break;
                }
                case "accent-color-changed": {
                    document.documentElement.style.cssText = "--accent-color: " + data[0];
                    break;
                }
                default: {
                    console.log("Uncaught message: " + eventType + " | " + data)
                    break;
                }
            }
        });
        sendToProcess("init");

        return () => window.removeEventListener("message", listener);
    }, []);


    return (
        <>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <a href="https://github.com/aarontburn/nexus-core" target="_blank"
                    style={{ width: "fit-content" }}>
                    <div className="logo nexus"></div>
                </a>
            </div>
            <h1><b>Nexus</b></h1>
            <h1>Sample React App</h1>
            <p>Sample setting is <b>{isSampleSettingOn ? "on" : "off"}</b>. Visit the <b>Settings</b> module to change it.</p>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <br />
                <br />
                <button onClick={() => sendToProcess("count", count)}>
                    Send <b>count</b> to process
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
        </>
    )
}

export default App
