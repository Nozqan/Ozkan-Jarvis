package com.example.features.apps

import android.content.Context
import android.content.Intent

class AppLauncherFeature(private val context: Context) {

    fun launchAppByName(appNameQuery: String): String {
        val pm = context.packageManager
        val query = appNameQuery.lowercase().trim()

        val packageMap = mapOf(
            "whatsapp" to "com.whatsapp",
            "youtube" to "com.google.android.youtube",
            "instagram" to "com.instagram.android",
            "spotify" to "com.spotify.music",
            "chrome" to "com.android.chrome",
            "harita" to "com.google.android.apps.maps",
            "maps" to "com.google.android.apps.maps",
            "galeri" to "com.google.android.apps.photos",
            "hesap makinesi" to "com.google.android.calculator"
        )

        val pkgName = packageMap[query]
        if (pkgName != null) {
            val intent = pm.getLaunchIntentForPackage(pkgName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return "$appNameQuery uygulaması açılıyor kral."
            }
        }

        val installedApps = pm.getInstalledApplications(0)
        for (app in installedApps) {
            val label = pm.getApplicationLabel(app).toString().lowercase()
            if (label.contains(query)) {
                val intent = pm.getLaunchIntentForPackage(app.packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    return "${pm.getApplicationLabel(app)} başlatılıyor kral."
                }
            }
        }

        return "'$appNameQuery' uygulaması cihazında bulunamadı kral."
    }
}
