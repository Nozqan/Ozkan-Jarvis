package com.example.features.audio

import android.content.Context
import android.media.AudioManager

class AudioFeature(private val context: Context) {

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun getMediaVolumePercent(): Int {
        val current = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        return if (max > 0) (current * 100) / max else 0
    }

    fun setMediaVolumePercent(percent: Int) {
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val target = ((percent.coerceIn(0, 100) / 100f) * max).toInt()
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI)
    }

    fun setVolumeMax() {
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, max, AudioManager.FLAG_SHOW_UI)
    }

    fun setVolumeMute() {
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, AudioManager.FLAG_SHOW_UI)
    }

    fun getRingtoneVolumePercent(): Int {
        val current = audioManager.getStreamVolume(AudioManager.STREAM_RING)
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_RING)
        return if (max > 0) (current * 100) / max else 0
    }
}
