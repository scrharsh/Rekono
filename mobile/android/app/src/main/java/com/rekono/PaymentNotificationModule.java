package com.rekono;

import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONObject;

public class PaymentNotificationModule extends ReactContextBaseJavaModule {
  private static final String PREFS_NAME = "rekono_payment_notifications";
  private static final String KEY_QUEUE = "pending_queue";

  public PaymentNotificationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "PaymentNotificationModule";
  }

  @ReactMethod
  public void openNotificationAccessSettings() {
    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getReactApplicationContext().startActivity(intent);
  }

  @ReactMethod
  public void hasNotificationAccess(Promise promise) {
    try {
      boolean granted = NotificationManagerCompat
        .getEnabledListenerPackages(getReactApplicationContext())
        .contains(getReactApplicationContext().getPackageName());
      promise.resolve(granted);
    } catch (Exception error) {
      promise.reject("NOTIFICATION_ACCESS_CHECK_FAILED", error);
    }
  }

  @ReactMethod
  public void drainPendingNotifications(Promise promise) {
    try {
      SharedPreferences prefs = getReactApplicationContext().getSharedPreferences(PREFS_NAME, 0);
      String rawQueue = prefs.getString(KEY_QUEUE, "[]");
      JSONArray queue = new JSONArray(rawQueue == null ? "[]" : rawQueue);
      WritableArray result = Arguments.createArray();

      for (int i = 0; i < queue.length(); i++) {
        JSONObject item = queue.getJSONObject(i);
        WritableMap map = Arguments.createMap();
        map.putString("packageName", item.optString("packageName", ""));
        map.putString("notificationKey", item.optString("notificationKey", ""));
        map.putInt("notificationId", item.optInt("notificationId", 0));
        map.putString("title", item.optString("title", ""));
        map.putString("text", item.optString("text", ""));
        map.putString("subText", item.optString("subText", ""));
        map.putString("bigText", item.optString("bigText", ""));
        map.putString("summaryText", item.optString("summaryText", ""));
        map.putString("body", item.optString("body", ""));
        map.putDouble("postTime", item.optDouble("postTime", System.currentTimeMillis()));
        map.putDouble("notificationWhen", item.optDouble("notificationWhen", System.currentTimeMillis()));
        result.pushMap(map);
      }

      prefs.edit().putString(KEY_QUEUE, "[]").apply();
      promise.resolve(result);
    } catch (Exception error) {
      promise.reject("NOTIFICATION_QUEUE_DRAIN_FAILED", error);
    }
  }
}
