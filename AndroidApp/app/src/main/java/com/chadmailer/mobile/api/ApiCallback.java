package com.chadmailer.mobile.api;

public interface ApiCallback {
    void onSuccess(Object data);

    void onError(ApiException error);
}
