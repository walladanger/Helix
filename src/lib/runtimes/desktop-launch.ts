export function launchBundledLlama(modelPath: string): Promise<void> {
  if (window.parent === window) return Promise.reject(new Error("Open Helix in the desktop installer to launch the bundled server."));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("The desktop shell did not respond.")), 15_000);
    function finish(error?: Error) {
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      if (error) reject(error); else resolve();
    }
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.data?.type !== "helix:launch-llama-result"
        || event.data.requestId !== requestId) return;
      finish(event.data.error ? new Error(String(event.data.error)) : undefined);
    }
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "helix:launch-llama", requestId, modelPath }, "*");
  });
}
