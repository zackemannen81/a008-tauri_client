use std::collections::HashMap;
use std::sync::Mutex;

use reqwest::header::{HeaderMap, HeaderName, HeaderValue, SET_COOKIE};
use reqwest::Method;
use url::Url;

struct CookieJar {
    cookies: Mutex<HashMap<String, String>>,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProxyHttpRequest {
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ProxyHttpResponse {
    status: u16,
    headers: Vec<(String, String)>,
    body: String,
}

fn loopback_http(url: &Url) -> bool {
    if url.scheme() != "http" && url.scheme() != "https" {
        return false;
    }
    let host = url.host_str().unwrap_or("").trim_matches(['[', ']']).to_ascii_lowercase();
    host == "localhost"
        || host == "::1"
        || host.ends_with(".localhost")
        || {
            let parts: Vec<&str> = host.split('.').collect();
            parts.len() == 4
                && parts[0] == "127"
                && parts.iter().all(|part| part.parse::<u8>().is_ok())
        }
}

fn store_cookies(jar: &CookieJar, headers: &HeaderMap) {
    let mut cookies = jar.cookies.lock().expect("cookie lock");
    for value in headers.get_all(SET_COOKIE) {
        let Ok(raw) = value.to_str() else { continue };
        let pair = raw.split(';').next().unwrap_or("").trim();
        let Some((name, val)) = pair.split_once('=') else { continue };
        if name.is_empty() {
            continue;
        }
        cookies.insert(name.trim().to_string(), val.trim().to_string());
    }
}

fn cookie_header(jar: &CookieJar) -> Option<String> {
    let cookies = jar.cookies.lock().expect("cookie lock");
    if cookies.is_empty() {
        return None;
    }
    Some(
        cookies
            .iter()
            .map(|(name, value)| format!("{name}={value}"))
            .collect::<Vec<_>>()
            .join("; "),
    )
}

#[tauri::command]
async fn proxy_http(
    jar: tauri::State<'_, CookieJar>,
    request: ProxyHttpRequest,
) -> Result<ProxyHttpResponse, String> {
    let url = Url::parse(&request.url).map_err(|error| error.to_string())?;
    if !loopback_http(&url) {
        return Err("A008 HTTP proxy only reaches loopback http(s) hosts.".into());
    }
    let method = Method::from_bytes(request.method.as_bytes()).map_err(|error| error.to_string())?;
    let mut headers = HeaderMap::new();
    for (name, value) in request.headers {
        let header_name = HeaderName::from_bytes(name.as_bytes()).map_err(|error| error.to_string())?;
        let header_value = HeaderValue::from_str(&value).map_err(|error| error.to_string())?;
        headers.insert(header_name, header_value);
    }
    if let Some(cookie) = cookie_header(&jar) {
        headers.insert(
            reqwest::header::COOKIE,
            HeaderValue::from_str(&cookie).map_err(|error| error.to_string())?,
        );
    }
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| error.to_string())?;
    let mut builder = client.request(method, url).headers(headers);
    if let Some(body) = request.body {
        builder = builder.body(body);
    }
    let response = builder.send().await.map_err(|error| error.to_string())?;
    store_cookies(&jar, response.headers());
    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            value
                .to_str()
                .ok()
                .map(|text| (name.as_str().to_string(), text.to_string()))
        })
        .collect();
    let body = response.text().await.map_err(|error| error.to_string())?;
    Ok(ProxyHttpResponse {
        status,
        headers,
        body,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(CookieJar {
            cookies: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![proxy_http])
        .run(tauri::generate_context!())
        .expect("error while running A008 Tauri client");
}
