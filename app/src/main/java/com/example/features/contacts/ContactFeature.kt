package com.example.features.contacts

import android.content.Context
import android.content.Intent
import android.net.Uri

class ContactFeature(private val context: Context) {

    fun makeDirectCall(numberOrName: String): String {
        val cleanNumber = numberOrName.replace(" ", "").trim()
        if (cleanNumber.all { it.isDigit() || it == '+' }) {
            val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$cleanNumber")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                context.startActivity(intent)
                return "$cleanNumber numarası aranıyor kral."
            } catch (e: Exception) {
                // Fallback to dialer if direct CALL_PHONE fails
                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(dialIntent)
                return "Arama ekranı açıldı: $cleanNumber"
            }
        } else {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(dialIntent)
            return "$numberOrName için arama ekranı açılıyor."
        }
    }

    fun openSmsApp(): String {
        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:")).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return try {
            context.startActivity(intent)
            "Mesajlar uygulaması açıldı kral."
        } catch (e: Exception) {
            "Mesajlar ekranı açılamadı."
        }
    }
}
