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
    frame.addEventListener("load", () => {
      frame.hidden = false;
      status.hidden = true;
    }, { once: true });
    frame.src = url;
  } catch (error) {
    status.textContent = typeof error === "string" ? error : "Helix could not start.";
  }
})();
