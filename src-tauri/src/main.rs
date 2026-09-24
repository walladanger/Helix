#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    net::{TcpListener, TcpStream},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{Manager, State};
use tauri_plugin_shell::{process::{CommandChild, CommandEvent}, ShellExt};
#[cfg(windows)]
use std::os::windows::process::CommandExt;

struct Server {
    child: Mutex<Option<CommandChild>>,
    url: String,
}

struct LlamaServer {
    child: Mutex<Option<Child>>,
    executable: PathBuf,
}

#[tauri::command]
fn launch_llama(model_path: String, llama: State<'_, LlamaServer>) -> Result<(), String> {
    let model = PathBuf::from(model_path.trim());
    if !model.is_absolute() || !model.is_file()
        || model.extension().and_then(|value| value.to_str()).map(|value| !value.eq_ignore_ascii_case("gguf")).unwrap_or(true)
    {
        return Err("Choose the absolute path of an existing GGUF model.".into());
    }
    if !llama.executable.is_file() {
        return Err("The bundled llama.cpp server is missing. Reinstall Helix.".into());
    }
    let mut child = llama.child.lock().map_err(|_| "Runtime state is unavailable")?;
    if let Some(active) = child.as_mut() {
        if active.try_wait().map_err(|error| error.to_string())?.is_none() {
            return Err("Helix has already started llama.cpp. Close Helix to stop it.".into());
        }
    }
    // Avoid replacing another user's server on the fixed local probe port.
    let _port = TcpListener::bind("127.0.0.1:8080")
        .map_err(|_| "Port 8080 is occupied. Stop the existing server before launching.".to_string())?;
    drop(_port);
    let mut command = Command::new(&llama.executable);
    command.arg("--model").arg(&model)
        .args(["--host", "127.0.0.1", "--port", "8080", "--n-gpu-layers", "99", "--split-mode", "layer"])
        .current_dir(llama.executable.parent().ok_or("Runtime directory is missing")?)
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    let spawned = command.spawn().map_err(|error| format!("Could not start llama.cpp: {error}"))?;
    *child = Some(spawned);
    Ok(())
}

#[tauri::command]
fn wait_for_server(server: State<'_, Server>) -> Result<String, String> {
    let address = server.url.trim_start_matches("http://");
    let started = Instant::now();
    while started.elapsed() < Duration::from_secs(30) {
        if let Ok(addr) = address.parse() {
            if TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok() {
                return Ok(server.url.clone());
            }
        }
        thread::sleep(Duration::from_millis(200));
    }
    Err("The Helix application server did not start. Close and reopen Helix.".into())
}

fn free_port() -> Result<u16, Box<dyn std::error::Error>> {
    let socket = TcpListener::bind("127.0.0.1:0")?;
    Ok(socket.local_addr()?.port())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![wait_for_server, launch_llama])
        .setup(|app| {
            let resources = app.path().resource_dir()?;
            let entry = resources.join("server").join("index.mjs");
            if !entry.is_file() {
                return Err(format!("Helix server resource missing: {}", entry.display()).into());
            }

            let port = free_port()?;
            let url = format!("http://127.0.0.1:{port}");
            let (mut events, child) = app
                .shell()
                .sidecar("node")?
                .arg(entry.as_os_str())
                .env("HOST", "127.0.0.1")
                .env("NITRO_HOST", "127.0.0.1")
                .env("PORT", port.to_string())
                .env("NITRO_PORT", port.to_string())
                .env("NODE_ENV", "production")
                .env("HELIX_DESKTOP", "1")
                .current_dir(&resources)
                .spawn()?;
            tauri::async_runtime::spawn(async move {
                while let Some(event) = events.recv().await {
                    if let CommandEvent::Error(message) = event {
                        eprintln!("Helix server: {message}");
                    }
                }
            });
            app.manage(Server {
                child: Mutex::new(Some(child)),
                url,
            });
            app.manage(LlamaServer {
                child: Mutex::new(None),
                executable: resources.join("runtimes").join("llama").join("llama-server.exe"),
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Unable to start Helix desktop")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(llama) = app.try_state::<LlamaServer>() {
                    if let Ok(mut child) = llama.child.lock() {
                        if let Some(mut child) = child.take() { let _ = child.kill(); let _ = child.wait(); }
                    }
                }
                if let Some(server) = app.try_state::<Server>() {
                    if let Ok(mut child) = server.child.lock() {
                        if let Some(child) = child.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
