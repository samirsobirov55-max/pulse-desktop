// Передаём токен нативному Android сервису через JavascriptInterface
// PulseBridge.saveToken() добавляется MainActivity через addJavascriptInterface

export function saveTokenForAndroid(token) {
  try {
    if (window.PulseBridge?.saveToken) {
      window.PulseBridge.saveToken(token);
    }
  } catch {}
}

export function clearTokenForAndroid() {
  try {
    if (window.PulseBridge?.clearToken) {
      window.PulseBridge.clearToken();
    }
  } catch {}
}
