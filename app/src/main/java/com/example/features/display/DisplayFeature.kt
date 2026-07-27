package com.example.features.display

import android.content.Context
import android.content.Intent
import android.provider.Settings

class DisplayFeature(private val context: Context) {

    fun getScreenBrightness(): Int {
        return try {
            val brightness = Settings.System.getInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS)
            (brightness * 100) / 255
        } catch (e: Exception) {
            50
        }
    }

    fun openDisplaySettings() {
        val intent = Intent(Settings.ACTION_DISPLAY_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
