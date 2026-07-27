package com.example.features.bluetooth

import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.provider.Settings

class BluetoothFeature(private val context: Context) {

    fun isBluetoothSupported(): Boolean {
        return BluetoothAdapter.getDefaultAdapter() != null
    }

    fun isBluetoothEnabled(): Boolean {
        val adapter = BluetoothAdapter.getDefaultAdapter()
        return adapter?.isEnabled == true
    }

    fun openBluetoothSettings() {
        val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun getBluetoothReport(): String {
        if (!isBluetoothSupported()) return "Cihazda Bluetooth donanımı bulunamadı."
        return if (isBluetoothEnabled()) "Bluetooth Aktif 🔵" else "Bluetooth Kapalı ⚪"
    }
}
