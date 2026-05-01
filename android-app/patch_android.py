#!/usr/bin/env python3
"""Pulse Android patcher - patches gradle and writes all Java sources"""
import os, re

# ── Patch Gradle files ──────────────────────────────────
def patch_gradle():
    app = "android-app/android/app/build.gradle"
    if os.path.exists(app):
        txt = open(app).read()
        print("BEFORE:", [l.strip() for l in txt.split("\n") if "Sdk" in l])
        # Заменяем все варианты написания
        txt = re.sub(r'compileSdkVersion\s+\d+', 'compileSdkVersion 34', txt)
        txt = re.sub(r'compileSdk\s+\d+', 'compileSdk 34', txt)
        txt = re.sub(r'targetSdkVersion\s+\d+', 'targetSdkVersion 34', txt)
        txt = re.sub(r'targetSdk\s+\d+', 'targetSdk 34', txt)
        print("AFTER:", [l.strip() for l in txt.split("\n") if "Sdk" in l])
        open(app, 'w').write(txt)
        print("app/build.gradle patched OK")

    root = "android-app/android/build.gradle"
    if os.path.exists(root):
        txt = open(root).read()
        txt = re.sub(r'com\.android\.tools\.build:gradle:[\d.]+', 'com.android.tools.build:gradle:8.2.2', txt)
        open(root, 'w').write(txt)
        print("root build.gradle patched")

    # Patch variables.gradle (Capacitor puts compileSdkVersion here)
    variables = "android-app/android/variables.gradle"
    if os.path.exists(variables):
        txt = open(variables).read()
        print("variables.gradle BEFORE:", [l.strip() for l in txt.split("\n") if "Sdk" in l or "sdk" in l.lower()])
        txt = re.sub(r'compileSdkVersion\s*=\s*\d+', 'compileSdkVersion = 34', txt)
        txt = re.sub(r'compileSdk\s*=\s*\d+', 'compileSdk = 34', txt)
        txt = re.sub(r'targetSdkVersion\s*=\s*\d+', 'targetSdkVersion = 34', txt)
        txt = re.sub(r'targetSdk\s*=\s*\d+', 'targetSdk = 34', txt)
        print("variables.gradle AFTER:", [l.strip() for l in txt.split("\n") if "Sdk" in l or "sdk" in l.lower()])
        open(variables, 'w').write(txt)
        print("variables.gradle patched OK")

    wrap = "android-app/android/gradle/wrapper/gradle-wrapper.properties"
    if os.path.exists(wrap):
        txt = open(wrap).read()
        txt = re.sub(r'gradle-[\d.]+-(?:all|bin)', 'gradle-8.2-all', txt)
        open(wrap, 'w').write(txt)
        print("gradle wrapper patched")

patch_gradle()


BASE = "android-app/android/app/src/main"
JAVA = f"{BASE}/java/com/auragra/pulse"
RES  = f"{BASE}/res/xml"

os.makedirs(JAVA, exist_ok=True)
os.makedirs(RES,  exist_ok=True)

# ── network_security_config ──
open(f"{RES}/network_security_config.xml", 'w').write(
'<?xml version="1.0" encoding="utf-8"?>\n'
'<network-security-config>\n'
'  <base-config cleartextTrafficPermitted="true">\n'
'    <trust-anchors><certificates src="system"/></trust-anchors>\n'
'  </base-config>\n'
'</network-security-config>\n'
)

# ── AndroidManifest ──
open(f"{BASE}/AndroidManifest.xml", 'w').write("""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CAMERA"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
  <uses-permission android:name="android.permission.READ_MEDIA_VIDEO"/>
  <uses-permission android:name="android.permission.READ_MEDIA_AUDIO"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29"/>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
  <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
  <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>
  <uses-feature android:name="android.hardware.camera" android:required="false"/>
  <uses-feature android:name="android.hardware.microphone" android:required="false"/>
  <application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true"
    android:hardwareAccelerated="true"
    android:networkSecurityConfig="@xml/network_security_config">
    <activity
      android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
      android:name=".MainActivity"
      android:label="@string/title_activity_main"
      android:theme="@style/AppTheme.NoActionBarLaunch"
      android:launchMode="singleTask"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    <service android:name=".PulseService" android:foregroundServiceType="dataSync" android:exported="false" android:stopWithTask="false"/>
    <service android:name=".NtfyListenerService" android:foregroundServiceType="dataSync" android:exported="false" android:stopWithTask="false"/>
    <receiver android:name=".CallActionReceiver" android:exported="false">
      <intent-filter>
        <action android:name="com.auragra.pulse.ACCEPT_CALL"/>
        <action android:name="com.auragra.pulse.REJECT_CALL"/>
      </intent-filter>
    </receiver>
    <receiver android:name=".BootReceiver" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
      </intent-filter>
    </receiver>
    <provider android:name="androidx.core.content.FileProvider"
      android:authorities="${applicationId}.fileprovider"
      android:exported="false" android:grantUriPermissions="true">
      <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths"/>
    </provider>
  </application>
</manifest>
""")

# ── MainActivity.java ──
open(f"{JAVA}/MainActivity.java", 'w').write("""package com.auragra.pulse;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final String SERVER = "https://auragram-telegram-web.hf.space";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestPermissions2();
        setupBridge();
        startServices();
        handleCallIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleCallIntent(intent);
    }

    private void handleCallIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("callAction");
        String callerId = intent.getStringExtra("callerId");
        if (action == null || callerId == null) return;
        String js = "window.dispatchEvent(new CustomEvent('pulse:call:" + action + "',{detail:{callerId:'" + callerId + "'}}))";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
    }

    private void setupBridge() {
        WebView wv = getBridge().getWebView();
        wv.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void saveToken(String t) {
                getSharedPreferences("PulsePrefs", MODE_PRIVATE).edit().putString("pulse_token", t).apply();
            }
            @JavascriptInterface
            public void saveTopic(String t) {
                getSharedPreferences("PulsePrefs", MODE_PRIVATE).edit().putString("ntfy_topic", t).apply();
            }
            @JavascriptInterface
            public void clearToken() {
                getSharedPreferences("PulsePrefs", MODE_PRIVATE).edit().remove("pulse_token").remove("ntfy_topic").apply();
            }
        }, "PulseBridge");

        wv.postDelayed(new Runnable() {
            public void run() {
                try {
                    String js = "(function(){" +
                        "var t=localStorage.getItem('pulse_token');" +
                        "if(t&&window.PulseBridge){" +
                        "PulseBridge.saveToken(t);" +
                        "fetch('" + SERVER + "/api/users/push/topic',{headers:{'Authorization':'Bearer '+t}})" +
                        ".then(r=>r.json()).then(d=>{if(d.topic)PulseBridge.saveTopic(d.topic);}).catch(()=>{});" +
                        "}" +
                        "})()";
                    wv.evaluateJavascript(js, null);
                } catch (Exception e) {}
                wv.postDelayed(this, 10000);
            }
        }, 3000);
    }

    private void startServices() {
        for (Class<?> svc : new Class[]{PulseService.class, NtfyListenerService.class}) {
            try {
                Intent i = new Intent(this, svc);
                if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
                else startService(i);
            } catch (Exception e) {}
        }
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getPackageName())));
            }
        } catch (Exception e) {}
    }

    private void requestPermissions2() {
        List<String> perms = new ArrayList<>();
        perms.add(Manifest.permission.CAMERA);
        perms.add(Manifest.permission.RECORD_AUDIO);
        perms.add(Manifest.permission.ACCESS_FINE_LOCATION);
        if (Build.VERSION.SDK_INT >= 33) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS);
            perms.add(Manifest.permission.READ_MEDIA_IMAGES);
            perms.add(Manifest.permission.READ_MEDIA_VIDEO);
        } else {
            perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        List<String> req = new ArrayList<>();
        for (String p : perms)
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED)
                req.add(p);
        if (!req.isEmpty())
            ActivityCompat.requestPermissions(this, req.toArray(new String[0]), 1001);
    }
}
""")

# ── PulseService.java ──
open(f"{JAVA}/PulseService.java", 'w').write("""package com.auragra.pulse;
import android.app.*;
import android.content.*;
import android.media.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.*;
import java.io.*;
import java.net.*;
import java.util.*;

public class PulseService extends Service {
    static final String SERVER = "https://auragram-telegram-web.hf.space";
    static final String CH_FG  = "pulse_fg";
    static final String CH_MSG = "pulse_msg";
    static final String CH_CALL= "pulse_call";
    private Handler handler;
    private final Set<String> shown = new HashSet<>();
    private PowerManager.WakeLock wl;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Pulse::WL");
        wl.acquire();
        startForeground(1, buildFgNotif());
        handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(poller, 5000);
    }

    final Runnable poller = new Runnable() {
        public void run() {
            new Thread(() -> poll()).start();
            handler.postDelayed(this, 20000);
        }
    };

    void createChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        NotificationChannel fg = new NotificationChannel(CH_FG, "Pulse активен", NotificationManager.IMPORTANCE_MIN);
        fg.setShowBadge(false); nm.createNotificationChannel(fg);
        NotificationChannel msg = new NotificationChannel(CH_MSG, "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msg.enableVibration(true); nm.createNotificationChannel(msg);
        AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build();
        NotificationChannel call = new NotificationChannel(CH_CALL, "Звонки", NotificationManager.IMPORTANCE_MAX);
        call.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), aa);
        call.setBypassDnd(true); call.enableVibration(true);
        nm.createNotificationChannel(call);
    }

    Notification buildFgNotif() {
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CH_FG)
            .setContentTitle("Pulse").setContentText("Активен")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pi).setSilent(true).setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN).build();
    }

    void poll() {
        String token = getSharedPreferences("PulsePrefs", MODE_PRIVATE).getString("pulse_token", null);
        if (token == null || token.isEmpty()) return;
        try {
            JSONObject data = get(SERVER + "/api/messages/notifications/unread", token);
            if (data != null) {
                JSONArray msgs = data.optJSONArray("messages");
                if (msgs != null) for (int i = 0; i < msgs.length(); i++) {
                    JSONObject m = msgs.getJSONObject(i);
                    String key = m.optString("chatId") + m.optString("content").hashCode();
                    if (shown.add(key)) notifyMsg(m.optString("senderName","Pulse"), m.optString("content",""), m.optString("chatId",""));
                    if (shown.size() > 500) shown.clear();
                }
            }
            JSONObject call = get(SERVER + "/api/chats/calls/incoming", token);
            if (call != null && call.optBoolean("hasCall"))
                notifyCall(call.optString("callerName","?"), call.optString("callerId",""), call.optBoolean("isVideo"));
        } catch (Exception e) {}
    }

    JSONObject get(String u, String token) {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
            c.setRequestProperty("Authorization", "Bearer " + token);
            c.setConnectTimeout(8000); c.setReadTimeout(8000);
            if (c.getResponseCode() != 200) return null;
            BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream()));
            StringBuilder sb = new StringBuilder(); String line;
            while ((line = r.readLine()) != null) sb.append(line);
            r.close(); return new JSONObject(sb.toString());
        } catch (Exception e) { return null; }
    }

    void notifyMsg(String sender, String body, String chatId) {
        Intent open = new Intent(this, MainActivity.class);
        open.putExtra("chatId", chatId);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, (int)System.currentTimeMillis(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationManagerCompat.from(this).notify((int)System.currentTimeMillis(),
            new NotificationCompat.Builder(this, CH_MSG)
                .setContentTitle(sender).setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentIntent(pi).setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH).build());
    }

    void notifyCall(String name, String callerId, boolean isVideo) {
        Intent acc = new Intent(this, CallActionReceiver.class);
        acc.setAction("com.auragra.pulse.ACCEPT_CALL"); acc.putExtra("callerId", callerId);
        PendingIntent accPi = PendingIntent.getBroadcast(this, 1, acc, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent rej = new Intent(this, CallActionReceiver.class);
        rej.setAction("com.auragra.pulse.REJECT_CALL"); rej.putExtra("callerId", callerId);
        PendingIntent rejPi = PendingIntent.getBroadcast(this, 2, rej, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationManagerCompat.from(this).notify(9999,
            new NotificationCompat.Builder(this, CH_CALL)
                .setContentTitle(isVideo ? "Видеозвонок" : "Звонок от " + name)
                .setContentText(name + " звонит вам")
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setFullScreenIntent(openPi, true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .addAction(android.R.drawable.ic_menu_call, "Принять", accPi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Отклонить", rejPi)
                .setOngoing(true).setTimeoutAfter(60000).build());
    }

    @Override public int onStartCommand(Intent i, int f, int id) { return START_STICKY; }
    @Override public void onDestroy() {
        super.onDestroy();
        if (wl != null && wl.isHeld()) wl.release();
        startService(new Intent(this, PulseService.class));
    }
    @Override public IBinder onBind(Intent i) { return null; }
}
""")

# ── NtfyListenerService.java ──
open(f"{JAVA}/NtfyListenerService.java", 'w').write("""package com.auragra.pulse;
import android.app.*;
import android.content.*;
import android.media.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.*;
import java.io.*;
import java.net.*;

public class NtfyListenerService extends Service {
    static final String NTFY = "https://ntfy.sh";
    private Thread thread;
    private volatile boolean running = true;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel("pulse_fg2", "Pulse Push", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        startForeground(2, new NotificationCompat.Builder(this, "pulse_fg2")
            .setContentTitle("Pulse").setContentText("Push активен")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setSilent(true).setOngoing(true).setPriority(NotificationCompat.PRIORITY_MIN).build());
        thread = new Thread(this::listen);
        thread.setDaemon(true);
        thread.start();
    }

    void listen() {
        while (running) {
            try {
                String topic = getSharedPreferences("PulsePrefs", MODE_PRIVATE).getString("ntfy_topic", null);
                if (topic == null || topic.isEmpty()) { Thread.sleep(5000); continue; }
                URL url = new URL(NTFY + "/" + topic + "/json");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(0);
                conn.connect();
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String line;
                while (running && (line = br.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;
                    try {
                        JSONObject ev = new JSONObject(line);
                        if (!"message".equals(ev.optString("event"))) continue;
                        String title = ev.optString("title", "Pulse");
                        String body  = ev.optString("message", "");
                        JSONObject hdrs = ev.optJSONObject("headers");
                        String type     = hdrs != null ? hdrs.optString("x-pulse-type", "message") : "message";
                        String cid      = hdrs != null ? hdrs.optString("x-pulse-chatid", "") : "";
                        String callerId = hdrs != null ? hdrs.optString("x-pulse-callerid", "") : "";
                        boolean isVideo = hdrs != null && "true".equals(hdrs.optString("x-pulse-isvideo", "false"));
                        if ("call".equals(type)) notifyCall(title, body, callerId, isVideo);
                        else notifyMsg(title, body, cid);
                    } catch (JSONException e) {}
                }
                br.close(); conn.disconnect();
            } catch (Exception e) {
                try { Thread.sleep(5000); } catch (InterruptedException ie) { break; }
            }
        }
    }

    void notifyMsg(String sender, String body, String chatId) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel("pulse_msg", "Сообщения", NotificationManager.IMPORTANCE_HIGH);
            ch.enableVibration(true);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        Intent open = new Intent(this, MainActivity.class);
        open.putExtra("chatId", chatId);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, (int)System.currentTimeMillis(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationManagerCompat.from(this).notify((int)System.currentTimeMillis(),
            new NotificationCompat.Builder(this, "pulse_msg")
                .setContentTitle(sender).setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentIntent(pi).setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH).build());
    }

    void notifyCall(String name, String body, String callerId, boolean isVideo) {
        if (Build.VERSION.SDK_INT >= 26) {
            AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build();
            NotificationChannel ch = new NotificationChannel("pulse_call", "Звонки", NotificationManager.IMPORTANCE_MAX);
            ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), aa);
            ch.setBypassDnd(true); ch.enableVibration(true);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        Intent acc = new Intent(this, CallActionReceiver.class);
        acc.setAction("com.auragra.pulse.ACCEPT_CALL"); acc.putExtra("callerId", callerId);
        PendingIntent accPi = PendingIntent.getBroadcast(this, 1, acc, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent rej = new Intent(this, CallActionReceiver.class);
        rej.setAction("com.auragra.pulse.REJECT_CALL"); rej.putExtra("callerId", callerId);
        PendingIntent rejPi = PendingIntent.getBroadcast(this, 2, rej, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent openPi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationManagerCompat.from(this).notify(9999,
            new NotificationCompat.Builder(this, "pulse_call")
                .setContentTitle(isVideo ? "Видеозвонок" : "Звонок: " + name)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setFullScreenIntent(openPi, true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .addAction(android.R.drawable.ic_menu_call, "Принять", accPi)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Отклонить", rejPi)
                .setOngoing(true).setTimeoutAfter(60000).build());
    }

    @Override public int onStartCommand(Intent i, int f, int id) { return START_STICKY; }
    @Override public void onDestroy() {
        running = false; super.onDestroy();
        startService(new Intent(this, NtfyListenerService.class));
    }
    @Override public IBinder onBind(Intent i) { return null; }
}
""")

# ── CallActionReceiver.java ──
open(f"{JAVA}/CallActionReceiver.java", 'w').write("""package com.auragra.pulse;
import android.app.NotificationManager;
import android.content.*;
public class CallActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        ((NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(9999);
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("callAction", "com.auragra.pulse.ACCEPT_CALL".equals(intent.getAction()) ? "accept" : "reject");
        open.putExtra("callerId", intent.getStringExtra("callerId"));
        ctx.startActivity(open);
    }
}
""")

# ── BootReceiver.java ──
open(f"{JAVA}/BootReceiver.java", 'w').write("""package com.auragra.pulse;
import android.content.*;
import android.os.Build;
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        for (Class<?> svc : new Class[]{PulseService.class, NtfyListenerService.class}) {
            Intent i = new Intent(ctx, svc);
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
            else ctx.startService(i);
        }
    }
}
""")

print("All Java sources written OK")
print(f"Files in {JAVA}:", os.listdir(JAVA))
