#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    net::{TcpListener, TcpStream},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{Manager, State};
use tauri_plugin_shell::{process::{CommandChild, CommandEvent}, ShellExt};

struct Server {
    child: Mutex<Option<CommandChild>>,
    url: String,
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
        .invoke_handler(tauri::generate_handler![wait_for_server])
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
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Unable to start Helix desktop")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
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
