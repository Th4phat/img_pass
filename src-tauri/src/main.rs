// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, os::windows::process::CommandExt, path::Path, process::{Command, Stdio}};
use tauri::InvokeError;
use walkdir::WalkDir;
use serde_json::Value;

const CREATE_NO_WINDOW: u32 = 0x08000000; // hide console flag

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn getfile(path: &str) -> Vec<String> {
    let mut out = Vec::new();
    for e in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        if e.metadata().unwrap().is_file() {
            out.push(e.path().display().to_string());
        }
    }
    out
}
#[tauri::command]
fn is_exif_installed() -> bool {
    if cfg!(windows) {
        Command::new("where")
            .arg("exiftool")
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    } else {
        Command::new("which")
            .arg("exiftool")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
}

#[tauri::command]
fn put_pass_in_img(pass: &str, path: &str) -> bool {
    let arg_string = format!("-ImageDescription={}", pass);
    let output = Command::new("exiftool")
        .arg("-overwrite_original") // Overwrite original file with new metadata
        .arg(&arg_string)
        .arg(path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .expect("Failed to execute exiftool");
    if output.status.success() {
        return true
    } else {
        return false
    }
}
#[tauri::command]
fn is_img_blank(path: &str) -> bool {
    if let Ok(output) = Command::new("exiftool")
        .arg("-ImageDescription")
        .arg(path)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        if output.status.success() {
            let output_str = String::from_utf8_lossy(&output.stdout);
            if output_str.contains("ImageDescription") {
                if let Some(description) = output_str
                    .lines()
                    .find(|line| line.contains("ImageDescription"))
                    .map(|line| line.splitn(2, ":").nth(1).unwrap_or("").trim())
                {
                    return description.is_empty();
                }
            }
        }
    }
    false
}
#[tauri::command]
fn read_img(path: &str) -> Result<Value, InvokeError> {
    let output = Command::new("exiftool")
        .arg(&path)
        .arg("-json")
        .stdout(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|err| InvokeError::from(err.to_string()))?;

    // Check if the command was successful
    if output.status.success() {
        let json_output = serde_json::from_slice(&output.stdout)
            .map_err(|err| InvokeError::from(err.to_string()))?;
        Ok(json_output)
    } else {
        // Print error message if the command failed
        eprintln!("exiftool failed with error: {:?}", output.status);
        Err(InvokeError::from("exiftool command failed"))
    }
}

#[tauri::command]
fn upload_image(files: Vec<String>, path:&str) {
    let out_path = Path::new(path);
    if !out_path.exists() {
        fs::create_dir_all(&out_path).expect("Failed to create directory");
    }

    for (index, file) in files.iter().enumerate() {
        let file_path = out_path.join(format!("file{}", index));
        fs::write(&file_path, file).expect("Failed to write file");
    }
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut _app = tauri::Builder::default()
    .setup(|_app| Ok({
        
    }))
        .invoke_handler(tauri::generate_handler![greet, getfile, is_exif_installed, put_pass_in_img, is_img_blank, read_img, upload_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    Ok(())
}
