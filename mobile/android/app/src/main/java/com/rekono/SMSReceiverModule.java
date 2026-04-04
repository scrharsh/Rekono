package com.rekono;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.concurrent.atomic.AtomicBoolean;

public class SMSReceiverModule extends ReactContextBaseJavaModule {
  private static final AtomicBoolean listening = new AtomicBoolean(false);
  private int listenerCount = 0;
  private static ReactApplicationContext reactContext;

  public SMSReceiverModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @NonNull
  @Override
  public String getName() {
    return "SMSReceiverModule";
  }

  @ReactMethod
  public void startListening() {
    listening.set(true);
  }

  @ReactMethod
  public void stopListening() {
    listening.set(false);
  }

  // Required by NativeEventEmitter in newer React Native versions.
  @ReactMethod
  public void addListener(String eventName) {
    listenerCount += 1;
  }

  // Required by NativeEventEmitter in newer React Native versions.
  @ReactMethod
  public void removeListeners(double count) {
    listenerCount -= (int) count;
    if (listenerCount < 0) {
      listenerCount = 0;
    }
  }

  public static boolean isListening() {
    return listening.get();
  }

  public static void emitSMSReceived(String body, String sender, long timestamp) {
    if (!isListening() || reactContext == null || !reactContext.hasActiveCatalystInstance()) {
      return;
    }

    WritableMap payload = Arguments.createMap();
    payload.putString("body", body);
    payload.putString("sender", sender);
    payload.putDouble("timestamp", timestamp);

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("onSMSReceived", payload);
  }
}
