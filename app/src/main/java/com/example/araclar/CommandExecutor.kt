package com.example.araclar

import android.content.Context
import android.util.Log
import com.example.features.apps.AppLauncherFeature
import com.example.features.audio.AudioFeature
import com.example.features.battery.BatteryFeature
import com.example.features.bluetooth.BluetoothFeature
import com.example.features.contacts.ContactFeature
import com.example.features.cyberpunk.CyberpunkEffectsFeature
import com.example.features.display.DisplayFeature
import com.example.features.hardware.HardwareFeature
import com.example.features.media.MediaControlFeature
import com.example.features.network.NetworkFeature
import com.example.features.notes.NotesMemoryFeature
import com.example.features.system.SystemInfoFeature
import org.json.JSONObject

class CommandExecutor(private val context: Context) {

    private val batteryFeature = BatteryFeature(context)
    private val networkFeature = NetworkFeature(context)
    private val bluetoothFeature = BluetoothFeature(context)
    private val audioFeature = AudioFeature(context)
    private val displayFeature = DisplayFeature(context)
    private val hardwareFeature = HardwareFeature(context)
    private val systemInfoFeature = SystemInfoFeature(context)
    private val appLauncherFeature = AppLauncherFeature(context)
    private val contactFeature = ContactFeature(context)
    private val notesMemoryFeature = NotesMemoryFeature(context)
    private val mediaControlFeature = MediaControlFeature(context)
    private val cyberpunkEffectsFeature = CyberpunkEffectsFeature()

    fun executeAction(actionJson: JSONObject, onResult: (String) -> Unit) {
        val action = actionJson.optString("action")
        try {
            hardwareFeature.triggerVibration(80)

            when (action) {
                "TOGGLE_FLASHLIGHT" -> {
                    val state = actionJson.optBoolean("state", true)
                    val success = hardwareFeature.setFlashlight(state)
                    onResult(if (success) (if (state) "Fener yakıldı kral." else "Fener kapatıldı.") else "Fener kontrol edilemedi.")
                }
                "OPEN_CAMERA" -> {
                    hardwareFeature.openCamera()
                    onResult("Kamera açılıyor kral.")
                }
                "TOGGLE_WIFI" -> {
                    networkFeature.openWifiSettings()
                    onResult("Wi-Fi ayarları açıldı kral.")
                }
                "TOGGLE_BLUETOOTH" -> {
                    bluetoothFeature.openBluetoothSettings()
                    onResult("Bluetooth ayarları açıldı kral.")
                }
                "CHECK_BATTERY" -> {
                    onResult(batteryFeature.getBatteryReport())
                }
                "CHECK_SYSTEM" -> {
                    val ram = systemInfoFeature.getRamSummary()
                    val storage = systemInfoFeature.getStorageSummary()
                    val device = systemInfoFeature.getDeviceInfo()
                    onResult("$device | $ram | $storage")
                }
                "CHECK_HUD" -> {
                    onResult(cyberpunkEffectsFeature.generateHudReport())
                }
                "SET_VOLUME" -> {
                    val level = actionJson.optInt("level", 50)
                    audioFeature.setMediaVolumePercent(level)
                    onResult("Medya sesi %$level seviyesine ayarlandı kral.")
                }
                "LAUNCH_APP" -> {
                    val appName = actionJson.optString("app_name", "")
                    onResult(appLauncherFeature.launchAppByName(appName))
                }
                "MAKE_CALL" -> {
                    val recipient = actionJson.optString("recipient", "")
                    onResult(contactFeature.makeDirectCall(recipient))
                }
                "SAVE_NOTE" -> {
                    val noteText = actionJson.optString("text", "")
                    onResult(notesMemoryFeature.saveQuickNote(noteText))
                }
                "LIST_NOTES" -> {
                    onResult(notesMemoryFeature.getNotesList())
                }
                "CLEAR_NOTES" -> {
                    onResult(notesMemoryFeature.clearNotes())
                }
                "MEDIA_NEXT" -> {
                    mediaControlFeature.playNextTrack()
                    onResult("Sonraki parçaya geçildi.")
                }
                "MEDIA_PREV" -> {
                    mediaControlFeature.playPreviousTrack()
                    onResult("Önceki parçaya geçildi.")
                }
                "MEDIA_TOGGLE" -> {
                    mediaControlFeature.togglePlayPause()
                    onResult("Medya oynatma durumu değiştirildi.")
                }
                else -> {
                    onResult("Komut işlendi kral: $action")
                }
            }
        } catch (e: Exception) {
            Log.e("CommandExecutor", "Error executing action $action: ${e.message}")
            onResult("Komut yürütülürken hata oluştu kral.")
        }
    }
}

