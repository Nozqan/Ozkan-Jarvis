package com.example.features.system

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.SystemClock

class SystemInfoFeature(private val context: Context) {

    fun getRamSummary(): String {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)

        val availGb = memoryInfo.availMem / (1024 * 1024 * 1024f)
        val totalGb = memoryInfo.totalMem / (1024 * 1024 * 1024f)
        val usedGb = totalGb - availGb

        return String.format("RAM: %.1f GB / %.1f GB kullanılıyor", usedGb, totalGb)
    }

    fun getStorageSummary(): String {
        return try {
            val stat = StatFs(Environment.getDataDirectory().path)
            val blockSize = stat.blockSizeLong
            val totalBlocks = stat.blockCountLong
            val availableBlocks = stat.availableBlocksLong

            val totalGb = (totalBlocks * blockSize) / (1024 * 1024 * 1024f)
            val availGb = (availableBlocks * blockSize) / (1024 * 1024 * 1024f)
            val usedGb = totalGb - availGb

            String.format("Depolama: %.1f GB / %.1f GB kullanılıyor", usedGb, totalGb)
        } catch (e: Exception) {
            "Depolama bilgisi alınamadı"
        }
    }

    fun getUptimeMinutes(): Long {
        return SystemClock.elapsedRealtime() / (1000 * 60)
    }

    fun getDeviceInfo(): String {
        val model = Build.MODEL
        val brand = Build.BRAND
        val androidVer = Build.VERSION.RELEASE
        return "$brand $model (Android $androidVer)"
    }
}
