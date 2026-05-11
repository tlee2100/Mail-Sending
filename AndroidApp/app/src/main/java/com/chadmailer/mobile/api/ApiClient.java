package com.chadmailer.mobile.api;

import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class ApiClient {
    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final AtomicBoolean isShutdown = new AtomicBoolean(false);
    private String baseUrl;

    public ApiClient(String baseUrl) {
        setBaseUrl(baseUrl);
    }

    public void setBaseUrl(String baseUrl) {
        String value = baseUrl == null ? "" : baseUrl.trim();
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        this.baseUrl = value;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void get(String token, String path, ApiCallback callback) {
        request("GET", token, path, null, callback);
    }

    public void post(String token, String path, JSONObject body, ApiCallback callback) {
        request("POST", token, path, body, callback);
    }

    public void request(String method, String token, String path, JSONObject body, ApiCallback callback) {
        if (isShutdown.get()) {
            return;
        }

        try {
            executor.execute(() -> {
                if (isShutdown.get()) {
                    return;
                }
                try {
                    Object data = execute(method, token, path, body);
                    postSuccess(callback, data);
                } catch (ApiException error) {
                    postError(callback, error);
                } catch (Exception error) {
                    ApiException wrapped = new ApiException(error.getMessage(), 0);
                    postError(callback, wrapped);
                }
            });
        } catch (RejectedExecutionException ignored) {
            // Requests can race with Activity teardown. Dropping them avoids late UI callbacks.
        }
    }

    private void postSuccess(ApiCallback callback, Object data) {
        if (isShutdown.get()) {
            return;
        }
        mainHandler.post(() -> {
            if (!isShutdown.get()) {
                callback.onSuccess(data);
            }
        });
    }

    private void postError(ApiCallback callback, ApiException error) {
        if (isShutdown.get()) {
            return;
        }
        mainHandler.post(() -> {
            if (!isShutdown.get()) {
                callback.onError(error);
            }
        });
    }

    public void shutdown() {
        if (isShutdown.compareAndSet(false, true)) {
            mainHandler.removeCallbacksAndMessages(null);
            executor.shutdownNow();
        }
    }

    private Object execute(String method, String token, String path, JSONObject body) throws Exception {
        if (baseUrl.isEmpty()) {
            throw new ApiException("API base URL is required", 0);
        }

        URL url = new URL(baseUrl + path);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        try {
            connection.setRequestMethod(method);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("Accept", "application/json");

            if (token != null && !token.trim().isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + token.trim());
            }

            if (body != null) {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                try (OutputStream output = connection.getOutputStream();
                     BufferedWriter writer = new BufferedWriter(
                         new OutputStreamWriter(output, StandardCharsets.UTF_8))) {
                    writer.write(body.toString());
                }
            }

            int statusCode = connection.getResponseCode();
            InputStream stream = statusCode >= 200 && statusCode < 300
                ? connection.getInputStream()
                : connection.getErrorStream();
            String responseText = readStream(stream);

            if (responseText.trim().isEmpty()) {
                if (statusCode >= 200 && statusCode < 300) {
                    return new JSONObject();
                }
                throw new ApiException("Request failed with status " + statusCode, statusCode);
            }

            Object parsed = new JSONTokener(responseText).nextValue();
            if (!(parsed instanceof JSONObject)) {
                if (statusCode >= 200 && statusCode < 300) {
                    return parsed;
                }
                throw new ApiException(responseText, statusCode);
            }

            JSONObject envelope = (JSONObject) parsed;
            boolean success = envelope.optBoolean("success", statusCode >= 200 && statusCode < 300);
            if (statusCode < 200 || statusCode >= 300 || !success) {
                String message = envelope.optString("message", "Request failed");
                Object details = envelope.opt("details");
                if (details != null && details != JSONObject.NULL) {
                    message = message + ": " + details;
                }
                throw new ApiException(message, statusCode);
            }

            Object data = envelope.opt("data");
            return data == null ? new JSONObject() : data;
        } finally {
            connection.disconnect();
        }
    }

    private String readStream(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }
}
