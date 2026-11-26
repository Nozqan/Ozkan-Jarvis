package com.akrepjarvis.app;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.os.Environment;
import android.os.StatFs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AkrepSystem")
public class AkrepSystemPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();

        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent battery = context.registerReceiver(null, filter);
        Integer percent = null;
        Boolean charging = null;
        if (battery != null) {
            int level = battery.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = battery.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (level >= 0 && scale > 0) {
                percent = Math.round(level * 100f / scale);
            }
            int status = battery.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            charging = status == BatteryManager.BATTERY_STATUS_CHARGING
                    || status == BatteryManager.BATTERY_STATUS_FULL;
        }

        boolean connected = false;
        String networkType = "Kullanılamıyor";
        ConnectivityManager connectivity = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivity != null) {
            android.net.Network network = connectivity.getActiveNetwork();
            NetworkCapabilities caps = connectivity.getNetworkCapabilities(network);
            if (caps != null) {
                connected = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) networkType = "Wi-Fi";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) networkType = "Mobil veri";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) networkType = "Ethernet";
                else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) networkType = "VPN";
            }
        }

        File dataDir = Environment.getDataDirectory();
        StatFs dataStat = new StatFs(dataDir.getPath());
        long blockSize = dataStat.getBlockSizeLong();
        long total = dataStat.getBlockCountLong() * blockSize;
        long free = dataStat.getAvailableBlocksLong() * blockSize;

        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
        if (activityManager != null) activityManager.getMemoryInfo(memoryInfo);

        Runtime runtime = Runtime.getRuntime();
        long appUsed = runtime.totalMemory() - runtime.freeMemory();

        JSObject batteryObject = new JSObject();
        batteryObject.put("supported", battery != null);
        batteryObject.put("percent", percent);
        batteryObject.put("charging", charging);
        batteryObject.put("temperatureC", battery != null ? battery.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) / 10.0 : null);

        JSObject networkObject = new JSObject();
        networkObject.put("connected", connected);
        networkObject.put("type", networkType);

        JSObject storageObject = new JSObject();
        storageObject.put("supported", true);
        storageObject.put("total", total);
        storageObject.put("free", free);
        storageObject.put("used", total - free);

        JSObject memoryObject = new JSObject();
        memoryObject.put("appUsed", appUsed);
        memoryObject.put("deviceTotal", memoryInfo.totalMem);
        memoryObject.put("deviceAvailable", memoryInfo.availMem);

        JSObject result = new JSObject();
        result.put("battery", batteryObject);
        result.put("network", networkObject);
        result.put("storage", storageObject);
        result.put("memory", memoryObject);
        call.resolve(result);
    }

    public void notifyBackPressed() {
        notifyListeners("backPressed", new JSObject());
    }
}
