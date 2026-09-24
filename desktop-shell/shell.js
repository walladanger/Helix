const { core, window: windowApi } = window.__TAURI__;
const nativeWindow = windowApi.getCurrentWindow();
const frame = document.getElementById("application");
const status = document.getElementById("status");

document.getElementById("minimize").addEventListener("click", () => nativeWindow.minimize());
document.getElementById("maximize").addEventListener("click", () => nativeWindow.toggleMaximize());
document.getElementById("close").addEventListener("click", () => nativeWindow.close());
document.querySelector(".titlebar").addEventListener("dblclick", (event) => {
  if (event.target.closest("button")) return;
  void nativeWindow.toggleMaximize();
});

void (async () => {
  try {
    // The installed React app runs on a loopback server; only this local shell
    // receives Tauri permissions. The framed app has no native shell privileges.
    const url = await core.invoke("wait_for_server");
    const applicationOrigin = new URL(url).origin;
    window.addEventListener("message", async (event) => {
      if (event.source !== frame.contentWindow || event.origin !== applicationOrigin) return;
      const message = event.data;
      if (message?.type !== "helix:launch-llama" || typeof message.requestId !== "string"
        || typeof message.modelPath !== "string" || message.modelPath.length > 4096) return;
      let error;
      try {
        await core.invoke("launch_llama", { modelPath: message.modelPath });
      } catch (caught) {
        error = typeof caught === "string" ? caught : "Could not launch llama.cpp.";
      }
      frame.contentWindow?.postMessage({ type: "helix:launch-llama-result", requestId: message.requestId, error }, applicationOrigin);
    });
    frame.addEventListener("load", () => {
      frame.hidden = false;
      status.hidden = true;
    }, { once: true });
    frame.src = url;
  } catch (error) {
    status.textContent = typeof error === "string" ? error : "Helix could not start.";
  }
})();
