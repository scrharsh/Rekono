package com.rekono;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;

public class SMSReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
      return;
    }

    Bundle extras = intent.getExtras();
    if (extras == null) {
      return;
    }

    Object[] pdus = (Object[]) extras.get("pdus");
    String format = extras.getString("format");
    if (pdus == null || pdus.length == 0) {
      return;
    }

    StringBuilder bodyBuilder = new StringBuilder();
    String sender = null;
    long timestamp = 0L;

    for (Object pdu : pdus) {
      SmsMessage message;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        message = SmsMessage.createFromPdu((byte[]) pdu, format);
      } else {
        message = SmsMessage.createFromPdu((byte[]) pdu);
      }

      if (message == null) {
        continue;
      }

      String partBody = message.getMessageBody();
      if (partBody != null) {
        bodyBuilder.append(partBody);
      }

      if (sender == null || sender.isEmpty()) {
        sender = message.getOriginatingAddress();
      }

      if (timestamp == 0L) {
        timestamp = message.getTimestampMillis();
      }
    }

    if (bodyBuilder.length() == 0) {
      return;
    }

    SMSReceiverModule.emitSMSReceived(
      bodyBuilder.toString(),
      sender == null ? "UNKNOWN" : sender,
      timestamp
    );
  }
}
