export function sendToProcess(eventType: string, ...data: any[]): void {
    return window.parent.postMessage({ eventType: eventType, data: data }, "*");
}

export function addProcessListener(callback: (eventType: string, ...data: any) => void) {
    const func = (event: MessageEvent): void => {
        callback(event.data.eventType, event.data.data);
    };
    window.addEventListener("message", func);
    return func;
}