package com.example.features.notes

import android.content.Context
import android.content.SharedPreferences

class NotesMemoryFeature(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("akrep_jarvis_notes", Context.MODE_PRIVATE)

    fun saveQuickNote(note: String): String {
        val existing = prefs.getString("notes_list", "") ?: ""
        val updated = if (existing.isBlank()) note else "$existing\n- $note"
        prefs.edit().putString("notes_list", updated).apply()
        return "Not hafızaya kaydedildi kral: '$note'"
    }

    fun getNotesList(): String {
        val notes = prefs.getString("notes_list", "") ?: ""
        return if (notes.isBlank()) "Hafızada kayıtlı not bulunmuyor kral." else "Kayıtlı Notların:\n$notes"
    }

    fun clearNotes(): String {
        prefs.edit().remove("notes_list").apply()
        return "Tüm notlar temizlendi kral."
    }
}
