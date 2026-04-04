package com.rekono;

import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class PaymentNotificationListenerService extends NotificationListenerService {
  private static final String PREFS_NAME = "rekono_payment_notifications";
  private static final String KEY_QUEUE = "pending_queue";
  private static final long DEDUPE_WINDOW_MS = 2 * 60 * 1000;
  private static final Map<String, Long> recentFingerprints = new ConcurrentHashMap<>();

  private static final String[] SUPPORTED_PACKAGES = new String[] {
    "com.phonepe.app",
    "com.google.android.apps.nbu.paisa.user",
    "net.one97.paytm",
    "in.org.npci.upiapp",
    "com.bhim.app",
    "com.paytm.app",
    "com.mobikwik_new",
    "com.freecharge.android",
    "com.airtel.payments.bank",
    "com.google.android.apps.walletnfcrel",
  };

  @Override
  public void onNotificationPosted(StatusBarNotification sbn) {
    if (sbn == null || sbn.getPackageName() == null) {
      return;
    }

    if (!isSupportedPaymentPackage(sbn.getPackageName())) {
      return;
    }

    Notification notification = sbn.getNotification();
    if (notification == null || notification.extras == null) {
      return;
    }

    String title = extractText(notification.extras, Notification.EXTRA_TITLE);
    String text = extractText(notification.extras, Notification.EXTRA_TEXT);
    String subText = extractText(notification.extras, Notification.EXTRA_SUB_TEXT);
    String bigText = extractText(notification.extras, Notification.EXTRA_BIG_TEXT);
    String summaryText = extractText(notification.extras, Notification.EXTRA_SUMMARY_TEXT);

    String body = joinParts(title, text, subText, bigText, summaryText);
    if (TextUtils.isEmpty(body)) {
      return;
    }

    String fingerprint = sbn.getPackageName() + "|" + body + "|" + notification.when;
    if (!shouldProcessFingerprint(fingerprint)) {
      return;
    }

    try {
      JSONObject payload = new JSONObject();
      payload.put("packageName", sbn.getPackageName());
      payload.put("notificationKey", sbn.getKey());
      payload.put("notificationId", sbn.getId());
      payload.put("title", title);
      payload.put("text", text);
      payload.put("subText", subText);
      payload.put("bigText", bigText);
      payload.put("summaryText", summaryText);
      payload.put("body", body);
      payload.put("postTime", System.currentTimeMillis());
      payload.put("notificationWhen", notification.when);

      enqueue(payload);
    } catch (Exception ignored) {
      // Swallow malformed payloads to avoid breaking notification delivery.
    }
  }

  private boolean isSupportedPaymentPackage(String packageName) {
    for (String supported : SUPPORTED_PACKAGES) {
      if (supported.equalsIgnoreCase(packageName)) {
        return true;
      }
    }
    return false;
  }

  private String extractText(Bundle extras, String key) {
    Object value = extras.get(key);
    return value == null ? "" : String.valueOf(value).trim();
  }

  private String joinParts(String... parts) {
    List<String> values = new ArrayList<>();
    for (String part : parts) {
      if (!TextUtils.isEmpty(part)) {
        values.add(part.trim());
      }
    }
    return TextUtils.join("\n", values);
  }

  private boolean shouldProcessFingerprint(String fingerprint) {
    long now = System.currentTimeMillis();
    cleanupFingerprints(now);

    Long lastSeen = recentFingerprints.get(fingerprint);
    if (lastSeen != null && now - lastSeen < DEDUPE_WINDOW_MS) {
      return false;
    }

    recentFingerprints.put(fingerprint, now);
    return true;
  }

  private void cleanupFingerprints(long now) {
    for (Map.Entry<String, Long> entry : recentFingerprints.entrySet()) {
      if (now - entry.getValue() > DEDUPE_WINDOW_MS) {
        recentFingerprints.remove(entry.getKey());
      }
    }
  }

  private void enqueue(JSONObject payload) {
    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    synchronized (PaymentNotificationListenerService.class) {
      try {
        JSONArray queue = new JSONArray(prefs.getString(KEY_QUEUE, "[]"));
        queue.put(payload);
        prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
      } catch (Exception ignored) {
        // If queue persistence fails, skip silently.
      }
    }
  }
}
