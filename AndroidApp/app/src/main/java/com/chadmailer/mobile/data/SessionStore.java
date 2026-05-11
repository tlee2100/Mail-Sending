package com.chadmailer.mobile.data;

import android.content.Context;
import android.content.SharedPreferences;

import com.chadmailer.mobile.BuildConfig;

import org.json.JSONObject;

public class SessionStore {
    private static final String PREFS = "chadmailer.session";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_NAME = "name";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_BASE_URL = "baseUrl";

    private final SharedPreferences preferences;

    public SessionStore(Context context) {
        preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public String getToken() {
        return preferences.getString(KEY_TOKEN, "");
    }

    public String getUserName() {
        return preferences.getString(KEY_NAME, "");
    }

    public String getUserEmail() {
        return preferences.getString(KEY_EMAIL, "");
    }

    public String getBaseUrl() {
        return preferences.getString(KEY_BASE_URL, BuildConfig.API_BASE_URL);
    }

    public void saveBaseUrl(String baseUrl) {
        preferences.edit().putString(KEY_BASE_URL, normalizeBaseUrl(baseUrl)).apply();
    }

    public void saveAuth(String token, JSONObject user) {
        String name = user == null ? "" : user.optString("name", "");
        String email = user == null ? "" : user.optString("email", "");
        preferences.edit()
            .putString(KEY_TOKEN, token == null ? "" : token)
            .putString(KEY_NAME, name)
            .putString(KEY_EMAIL, email)
            .apply();
    }

    public void clearAuth() {
        preferences.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_NAME)
            .remove(KEY_EMAIL)
            .apply();
    }

    private String normalizeBaseUrl(String value) {
        String next = value == null ? "" : value.trim();
        while (next.endsWith("/")) {
            next = next.substring(0, next.length() - 1);
        }
        return next;
    }
}
