package com.chadmailer.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.chadmailer.mobile.api.ApiCallback;
import com.chadmailer.mobile.api.ApiClient;
import com.chadmailer.mobile.api.ApiException;
import com.chadmailer.mobile.data.SessionStore;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(238, 242, 247);
    private static final int SURFACE = Color.WHITE;
    private static final int SURFACE_SOFT = Color.rgb(248, 250, 252);
    private static final int TEXT = Color.rgb(15, 23, 42);
    private static final int MUTED = Color.rgb(100, 116, 139);
    private static final int LINE = Color.rgb(226, 232, 240);
    private static final int BLUE = Color.rgb(37, 99, 235);
    private static final int GREEN = Color.rgb(22, 163, 74);
    private static final int AMBER = Color.rgb(217, 119, 6);
    private static final int ROSE = Color.rgb(225, 29, 72);
    private static final int LOGIN_DARK = Color.rgb(2, 6, 23);
    private static final int LOGIN_TEXT = Color.rgb(226, 232, 240);
    private static final int LOGIN_MUTED = Color.rgb(148, 163, 184);
    private static final int INDIGO = Color.rgb(79, 70, 229);

    private SessionStore sessionStore;
    private ApiClient apiClient;
    private LinearLayout root;
    private LinearLayout content;
    private ScrollView contentScroll;
    private TextView screenTitle;
    private Button avatar;
    private final List<Button> tabButtons = new ArrayList<>();
    private final List<String> tabKeys = new ArrayList<>();
    private String currentTab = "dashboard";
    private int viewGeneration = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(SURFACE);
        window.setNavigationBarColor(SURFACE);

        sessionStore = new SessionStore(this);
        apiClient = new ApiClient(sessionStore.getBaseUrl());

        if (sessionStore.getToken().isEmpty()) {
            showLogin();
        } else {
            showApp();
        }
    }

    @Override
    protected void onDestroy() {
        if (apiClient != null) {
            apiClient.shutdown();
        }
        super.onDestroy();
    }

    private void showLogin() {
        viewGeneration++;
        getWindow().setStatusBarColor(Color.rgb(238, 240, 255));
        getWindow().setNavigationBarColor(Color.rgb(245, 247, 252));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackground(loginBackground());

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setGravity(Gravity.CENTER);
        page.setPadding(dp(22), dp(32), dp(22), dp(32));
        scroll.addView(page, new ScrollView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(24), dp(26), dp(24), dp(24));
        card.setBackground(round(LOGIN_DARK, 18));
        card.setElevation(dp(18));
        int cardWidth = Math.min(dp(520), getResources().getDisplayMetrics().widthPixels - dp(44));
        page.addView(card, new LinearLayout.LayoutParams(
            cardWidth,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        TextView logo = text("CM", 18, Color.WHITE, Typeface.BOLD);
        logo.setGravity(Gravity.CENTER);
        logo.setBackground(round(Color.rgb(37, 99, 235), 14));
        card.addView(logo, fixed(dp(50), dp(50)));
        card.addView(space(22));

        TextView title = text("ChadMailer Login", 25, LOGIN_TEXT, Typeface.BOLD);
        card.addView(title);

        TextView subtitle = text(
            "Dang nhap de truy cap Dashboard. Tai khoan vi du:\nfrontend.demo@email.com / Demo@123456",
            14,
            LOGIN_MUTED,
            Typeface.NORMAL
        );
        subtitle.setLineSpacing(dp(3), 1f);
        subtitle.setPadding(0, dp(14), 0, dp(22));
        card.addView(subtitle);

        EditText baseUrlInput = loginInput("API Base URL", sessionStore.getBaseUrl(), false);
        EditText nameInput = loginInput("Name", "", false);
        EditText emailInput = loginInput("Email", "frontend.demo@email.com", false);
        EditText passwordInput = loginInput("Mat khau", "Demo@123456", true);
        nameInput.setVisibility(View.GONE);

        card.addView(loginLabel("Email"));
        card.addView(emailInput, matchHeight(dp(52)));
        card.addView(space(16));
        card.addView(loginLabel("Mat khau"));
        card.addView(passwordInput, matchHeight(dp(52)));
        card.addView(space(18));

        Button loginButton = loginPrimaryButton("Dang nhap");
        card.addView(loginButton, matchHeight(dp(50)));
        card.addView(space(14));

        TextView toggleMode = text("Chua co tai khoan? Tao tai khoan", 14, Color.rgb(34, 211, 238), Typeface.NORMAL);
        toggleMode.setGravity(Gravity.CENTER);
        card.addView(toggleMode);

        LinearLayout registerExtras = new LinearLayout(this);
        registerExtras.setOrientation(LinearLayout.VERTICAL);
        registerExtras.setVisibility(View.GONE);
        registerExtras.setPadding(0, dp(16), 0, 0);
        registerExtras.addView(loginLabel("Ten hien thi"));
        registerExtras.addView(nameInput, matchHeight(dp(52)));
        registerExtras.addView(space(14));
        registerExtras.addView(loginLabel("Backend URL"));
        registerExtras.addView(baseUrlInput, matchHeight(dp(52)));
        TextView backendHint = text("Emulator mac dinh: http://10.0.2.2:5000/api/v1", 12, LOGIN_MUTED, Typeface.NORMAL);
        backendHint.setPadding(0, dp(8), 0, 0);
        registerExtras.addView(backendHint);
        card.addView(registerExtras);

        final boolean[] registerMode = {false};
        toggleMode.setOnClickListener(v -> {
            registerMode[0] = !registerMode[0];
            registerExtras.setVisibility(registerMode[0] ? View.VISIBLE : View.GONE);
            loginButton.setText(registerMode[0] ? "Tao tai khoan" : "Dang nhap");
            toggleMode.setText(registerMode[0] ? "Da co tai khoan? Dang nhap" : "Chua co tai khoan? Tao tai khoan");
        });

        loginButton.setOnClickListener(v -> authenticate(
            registerMode[0],
            baseUrlInput.getText().toString(),
            nameInput.getText().toString(),
            emailInput.getText().toString(),
            passwordInput.getText().toString()
        ));

        setContentView(scroll);
    }

    private void authenticate(boolean register, String baseUrl, String name, String email, String password) {
        String trimmedBaseUrl = baseUrl.trim();
        String trimmedEmail = email.trim();
        String trimmedName = name.trim();

        if (trimmedBaseUrl.isEmpty() || trimmedEmail.isEmpty() || password.trim().isEmpty()) {
            toast("API URL, email and password are required");
            return;
        }

        sessionStore.saveBaseUrl(trimmedBaseUrl);
        apiClient.setBaseUrl(trimmedBaseUrl);

        try {
            JSONObject body = new JSONObject()
                .put("email", trimmedEmail)
                .put("password", password);
            if (register) {
                body.put("name", trimmedName.isEmpty() ? trimmedEmail.split("@")[0] : trimmedName);
                body.put("role", "admin");
            }

            String path = register ? "/auth/register" : "/auth/login";
            showBusy("Connecting...");
            apiClient.post(null, path, body, new ApiCallback() {
                @Override
                public void onSuccess(Object data) {
                    JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                    String token = result.optString("token", "");
                    JSONObject user = result.optJSONObject("user");
                    if (token.isEmpty()) {
                        toast("Login response did not include token");
                        return;
                    }
                    sessionStore.saveAuth(token, user);
                    showApp();
                }

                @Override
                public void onError(ApiException error) {
                    showLogin();
                    toast(error.getMessage());
                }
            });
        } catch (Exception error) {
            toast(error.getMessage());
        }
    }

    private void showBusy(String message) {
        viewGeneration++;
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setGravity(Gravity.CENTER);
        page.setPadding(dp(18), dp(18), dp(18), dp(18));
        page.setBackgroundColor(BG);
        TextView text = text(message, 16, TEXT, Typeface.BOLD);
        page.addView(text);
        setContentView(page);
    }

    private void showApp() {
        viewGeneration++;
        getWindow().setStatusBarColor(SURFACE);
        getWindow().setNavigationBarColor(SURFACE);

        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        root.addView(buildTopbar(), matchHeight(dp(82)));
        root.addView(buildBody(), new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1f
        ));

        setContentView(root);
        selectTab(currentTab);
    }

    private View buildTopbar() {
        LinearLayout topbar = new LinearLayout(this);
        topbar.setOrientation(LinearLayout.HORIZONTAL);
        topbar.setGravity(Gravity.CENTER_VERTICAL);
        topbar.setPadding(dp(18), dp(12), dp(18), dp(10));
        topbar.setBackground(border(SURFACE, 0, LINE, 1));

        LinearLayout titleStack = new LinearLayout(this);
        titleStack.setOrientation(LinearLayout.VERTICAL);
        titleStack.setGravity(Gravity.CENTER_VERTICAL);

        TextView eyebrow = text("ChadMailer", 12, MUTED, Typeface.BOLD);
        eyebrow.setAllCaps(true);
        screenTitle = text("Dashboard", 22, TEXT, Typeface.BOLD);
        titleStack.addView(eyebrow);
        titleStack.addView(screenTitle);

        topbar.addView(titleStack, new LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.MATCH_PARENT,
            1f
        ));

        avatar = new Button(this);
        avatar.setAllCaps(false);
        avatar.setText(userInitial());
        avatar.setTextSize(16);
        avatar.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        avatar.setTextColor(Color.WHITE);
        avatar.setBackground(round(BLUE, 14));
        avatar.setOnClickListener(v -> openAccountMenu());
        topbar.addView(avatar, fixed(dp(42), dp(42)));

        return topbar;
    }

    private View buildBody() {
        FrameLayout body = new FrameLayout(this);
        body.setBackgroundColor(BG);

        contentScroll = new ScrollView(this);
        contentScroll.setFillViewport(true);
        contentScroll.setClipToPadding(false);

        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(96));
        contentScroll.addView(content, new ScrollView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        body.addView(contentScroll, frameMatch());
        body.addView(buildBottomTabs(), bottomTabParams());
        return body;
    }

    private View buildBottomTabs() {
        LinearLayout tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        tabs.setGravity(Gravity.CENTER);
        tabs.setPadding(dp(8), dp(8), dp(8), dp(8));
        tabs.setBackground(border(SURFACE, 18, LINE, 1));
        tabs.setElevation(dp(8));

        tabButtons.clear();
        tabKeys.clear();
        addTab(tabs, "dashboard", "Home");
        addTab(tabs, "send", "Send");
        addTab(tabs, "campaigns", "Campaigns");
        addTab(tabs, "contacts", "Contacts");
        addTab(tabs, "tags", "Tags");
        return tabs;
    }

    private void addTab(LinearLayout tabs, String key, String label) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(label);
        button.setTextSize(10);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setMinHeight(0);
        button.setMinWidth(0);
        button.setPadding(dp(2), 0, dp(2), 0);
        button.setOnClickListener(v -> selectTab(key));
        tabs.addView(button, new LinearLayout.LayoutParams(
            0,
            dp(48),
            1f
        ));
        tabButtons.add(button);
        tabKeys.add(key);
    }

    private void selectTab(String tab) {
        currentTab = tab;
        screenTitle.setText(titleFor(tab));

        for (int i = 0; i < tabButtons.size(); i++) {
            boolean active = tabKeys.get(i).equals(tab);
            Button button = tabButtons.get(i);
            button.setTextColor(active ? BLUE : MUTED);
            button.setBackground(active ? translucent(BLUE, 26, 12) : round(Color.TRANSPARENT, 12));
        }

        if ("dashboard".equals(tab)) {
            renderDashboard();
        } else if ("send".equals(tab)) {
            renderQuickSend();
        } else if ("campaigns".equals(tab)) {
            renderCampaigns();
        } else if ("contacts".equals(tab)) {
            renderContacts("");
        } else if ("tags".equals(tab)) {
            renderTags();
        }
    }

    private void renderDashboard() {
        content.removeAllViews();
        content.addView(loadingCard("Loading dashboard..."));

        apiClient.get(token(), "/dashboard/overview", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                JSONObject overview = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONObject stats = overview.optJSONObject("stats");
                if (stats == null) {
                    stats = new JSONObject();
                }

                content.removeAllViews();
                content.addView(metricGrid(
                    metricCard("Sent", formatNumber(stats.optInt("total_sent", 0))),
                    metricCard("Campaigns", formatNumber(stats.optInt("total_campaigns", 0))),
                    metricCard("Contacts", formatNumber(stats.optInt("active_contacts", 0))),
                    metricCard("SMTP live", formatNumber(stats.optInt("active_accounts", 0)))
                ));

                LinearLayout campaignPanel = panel();
                LinearLayout head = row();
                head.addView(sectionTitle("Active campaigns"), new LinearLayout.LayoutParams(
                    0,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    1f
                ));
                TextView pill = pill("Healthy", GREEN);
                head.addView(pill);
                campaignPanel.addView(head);
                campaignPanel.addView(space(4));
                campaignPanel.addView(text("Loading campaigns...", 13, MUTED, Typeface.NORMAL));
                content.addView(withTopMargin(campaignPanel, 14));
                loadDashboardCampaigns(campaignPanel);

                LinearLayout alerts = panel();
                alerts.addView(sectionTitle("Recent alerts"));
                JSONArray recent = overview.optJSONArray("recentActivity");
                if (recent == null || recent.length() == 0) {
                    alerts.addView(alertLine("No recent email logs yet"));
                } else {
                    for (int i = 0; i < Math.min(recent.length(), 4); i++) {
                        JSONObject item = recent.optJSONObject(i);
                        if (item != null) {
                            String status = item.optString("status", "log");
                            String email = item.optString("email", "");
                            alerts.addView(alertLine(status + " - " + email));
                        }
                    }
                }
                content.addView(withTopMargin(alerts, 14));
            }

            @Override
            public void onError(ApiException error) {
                renderError("Dashboard failed: " + error.getMessage(), () -> renderDashboard());
            }
        });
    }

    private void loadDashboardCampaigns(LinearLayout panel) {
        apiClient.get(token(), "/campaigns?pageSize=3", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                while (panel.getChildCount() > 2) {
                    panel.removeViewAt(2);
                }
                JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONArray items = result.optJSONArray("items");
                if (items == null || items.length() == 0) {
                    panel.addView(alertLine("No campaigns yet"));
                    return;
                }
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.optJSONObject(i);
                    if (item != null) {
                        panel.addView(campaignRow(item));
                    }
                }
            }

            @Override
            public void onError(ApiException error) {
                panel.addView(alertLine(error.getMessage()));
            }
        });
    }

    private void renderQuickSend() {
        content.removeAllViews();

        LinearLayout form = panel();
        form.addView(sectionTitle("Quick Send"));

        List<JSONObject> accountItems = new ArrayList<>();
        List<String> accountLabels = new ArrayList<>();
        accountLabels.add("Loading senders...");
        Spinner accountSpinner = spinner(accountLabels);

        List<JSONObject> templateItems = new ArrayList<>();
        List<String> templateLabels = new ArrayList<>();
        templateLabels.add("Loading templates...");
        Spinner templateSpinner = spinner(templateLabels);

        List<JSONObject> tagItems = new ArrayList<>();
        List<String> tagLabels = new ArrayList<>();
        tagLabels.add("Loading tags...");
        Spinner tagSpinner = spinner(tagLabels);

        EditText previewEmail = input("Preview recipient", sessionStore.getUserEmail(), false);
        EditText recipientsInput = input("Recipients", "", false);
        recipientsInput.setMinLines(3);
        recipientsInput.setGravity(Gravity.TOP | Gravity.START);
        EditText subjectInput = input("Subject", "", false);
        EditText contentInput = input("Content", "", false);
        contentInput.setMinLines(5);
        contentInput.setGravity(Gravity.TOP | Gravity.START);

        form.addView(label("Sender"));
        form.addView(accountSpinner, matchHeight(dp(48)));
        form.addView(space(12));
        form.addView(label("Template"));
        form.addView(templateSpinner, matchHeight(dp(48)));
        form.addView(space(12));
        form.addView(label("Audience tag"));
        form.addView(tagSpinner, matchHeight(dp(48)));
        form.addView(space(10));

        Button loadTagButton = secondaryButton("Load tag recipients");
        form.addView(loadTagButton, matchHeight(dp(46)));
        form.addView(space(12));
        form.addView(label("Preview email"));
        form.addView(previewEmail, matchHeight(dp(48)));
        form.addView(space(12));
        form.addView(label("Recipients"));
        form.addView(recipientsInput, matchHeight(dp(92)));
        form.addView(space(12));
        form.addView(label("Subject"));
        form.addView(subjectInput, matchHeight(dp(48)));
        form.addView(space(12));
        form.addView(label("Content"));
        form.addView(contentInput, matchHeight(dp(130)));
        form.addView(space(16));

        Button previewButton = actionButton("Send Preview", GREEN);
        Button sendButton = actionButton("Send Campaign", BLUE);
        form.addView(previewButton, matchHeight(dp(48)));
        form.addView(space(10));
        form.addView(sendButton, matchHeight(dp(48)));
        content.addView(form);

        templateSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position >= 0 && position < templateItems.size()) {
                    JSONObject template = templateItems.get(position);
                    subjectInput.setText(template.optString("subject", ""));
                    loadTemplateDetail(template.optInt("id", 0), subjectInput, contentInput);
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        loadTagButton.setOnClickListener(v -> {
            int position = tagSpinner.getSelectedItemPosition();
            if (position < 0 || position >= tagItems.size()) {
                toast("No tag selected");
                return;
            }
            int tagId = tagItems.get(position).optInt("id", 0);
            loadTagRecipients(tagId, recipientsInput);
        });

        previewButton.setOnClickListener(v -> sendQuickEmail(
            true,
            accountItems,
            accountSpinner,
            previewEmail,
            recipientsInput,
            subjectInput,
            contentInput
        ));
        sendButton.setOnClickListener(v -> sendQuickEmail(
            false,
            accountItems,
            accountSpinner,
            previewEmail,
            recipientsInput,
            subjectInput,
            contentInput
        ));

        loadAccounts(accountItems, accountLabels, (ArrayAdapter<String>) accountSpinner.getAdapter());
        loadTemplates(templateItems, templateLabels, (ArrayAdapter<String>) templateSpinner.getAdapter());
        loadTags(tagItems, tagLabels, (ArrayAdapter<String>) tagSpinner.getAdapter());
    }

    private void loadAccounts(List<JSONObject> items, List<String> labels, ArrayAdapter<String> adapter) {
        apiClient.get(token(), "/email-accounts", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                items.clear();
                labels.clear();
                JSONArray array = data instanceof JSONArray ? (JSONArray) data : new JSONArray();
                for (int i = 0; i < array.length(); i++) {
                    JSONObject item = array.optJSONObject(i);
                    if (item != null) {
                        items.add(item);
                        String label = item.optString("email_address", "Sender");
                        if (item.optBoolean("is_default", false)) {
                            label += " (default)";
                        }
                        labels.add(label);
                    }
                }
                if (labels.isEmpty()) {
                    labels.add("No sender account");
                }
                adapter.notifyDataSetChanged();
            }

            @Override
            public void onError(ApiException error) {
                labels.clear();
                labels.add("Failed to load senders");
                adapter.notifyDataSetChanged();
            }
        });
    }

    private void loadTemplates(List<JSONObject> items, List<String> labels, ArrayAdapter<String> adapter) {
        apiClient.get(token(), "/templates?pageSize=100&isActive=true", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                items.clear();
                labels.clear();
                JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONArray array = result.optJSONArray("items");
                if (array != null) {
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject item = array.optJSONObject(i);
                        if (item != null) {
                            items.add(item);
                            labels.add(item.optString("template_name", "Template"));
                        }
                    }
                }
                if (labels.isEmpty()) {
                    labels.add("No active template");
                }
                adapter.notifyDataSetChanged();
            }

            @Override
            public void onError(ApiException error) {
                labels.clear();
                labels.add("Failed to load templates");
                adapter.notifyDataSetChanged();
            }
        });
    }

    private void loadTags(List<JSONObject> items, List<String> labels, ArrayAdapter<String> adapter) {
        apiClient.get(token(), "/contacts/tags", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                items.clear();
                labels.clear();
                JSONArray array = data instanceof JSONArray ? (JSONArray) data : new JSONArray();
                for (int i = 0; i < array.length(); i++) {
                    JSONObject item = array.optJSONObject(i);
                    if (item != null) {
                        items.add(item);
                        labels.add(item.optString("tag_name", "Tag"));
                    }
                }
                if (labels.isEmpty()) {
                    labels.add("No tags");
                }
                adapter.notifyDataSetChanged();
            }

            @Override
            public void onError(ApiException error) {
                labels.clear();
                labels.add("Failed to load tags");
                adapter.notifyDataSetChanged();
            }
        });
    }

    private void loadTemplateDetail(int templateId, EditText subjectInput, EditText contentInput) {
        if (templateId <= 0) {
            return;
        }
        apiClient.get(token(), "/templates/" + templateId, new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                JSONObject template = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                subjectInput.setText(template.optString("subject", subjectInput.getText().toString()));
                String contentText = template.optString("content_text", "");
                if (contentText.trim().isEmpty()) {
                    contentText = template.optString("preview_text", "");
                }
                contentInput.setText(contentText);
            }

            @Override
            public void onError(ApiException error) {
                toast("Template detail failed: " + error.getMessage());
            }
        });
    }

    private void loadTagRecipients(int tagId, EditText recipientsInput) {
        if (tagId <= 0) {
            toast("No tag selected");
            return;
        }
        apiClient.get(token(), "/contacts/tags/" + tagId + "/recipients", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONArray recipients = result.optJSONArray("recipients");
                List<String> emails = new ArrayList<>();
                if (recipients != null) {
                    for (int i = 0; i < recipients.length(); i++) {
                        JSONObject item = recipients.optJSONObject(i);
                        String email = item == null ? "" : item.optString("email", "");
                        if (!email.isEmpty()) {
                            emails.add(email);
                        }
                    }
                }
                recipientsInput.setText(joinLines(emails));
                toast("Loaded " + emails.size() + " recipients");
            }

            @Override
            public void onError(ApiException error) {
                toast(error.getMessage());
            }
        });
    }

    private void sendQuickEmail(
        boolean preview,
        List<JSONObject> accounts,
        Spinner accountSpinner,
        EditText previewEmail,
        EditText recipientsInput,
        EditText subjectInput,
        EditText contentInput
    ) {
        try {
            String subject = subjectInput.getText().toString().trim();
            String contentText = contentInput.getText().toString().trim();
            if (subject.isEmpty() || contentText.isEmpty()) {
                toast("Subject and content are required");
                return;
            }

            JSONObject body = new JSONObject()
                .put("subject", subject)
                .put("content", contentText);

            int accountIndex = accountSpinner.getSelectedItemPosition();
            if (accountIndex >= 0 && accountIndex < accounts.size()) {
                int accountId = accounts.get(accountIndex).optInt("id", 0);
                if (accountId > 0) {
                    body.put("emailAccountId", accountId);
                }
            }

            String path;
            if (preview) {
                String email = previewEmail.getText().toString().trim();
                if (email.isEmpty()) {
                    toast("Preview email is required");
                    return;
                }
                body.put("previewEmail", email);
                path = "/individual-emails/preview";
            } else {
                JSONArray recipients = recipientsArray(recipientsInput.getText().toString());
                if (recipients.length() == 0) {
                    toast("At least one recipient is required");
                    return;
                }
                body.put("recipients", recipients);
                path = "/individual-emails/send";
            }

            toast(preview ? "Sending preview..." : "Sending emails...");
            apiClient.post(token(), path, body, new ApiCallback() {
                @Override
                public void onSuccess(Object data) {
                    JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                    int sent = result.optInt("sentCount", 0);
                    int failed = result.optInt("failedCount", 0);
                    toast("Sent " + sent + ", failed " + failed);
                }

                @Override
                public void onError(ApiException error) {
                    toast(error.getMessage());
                }
            });
        } catch (Exception error) {
            toast(error.getMessage());
        }
    }

    private void renderCampaigns() {
        content.removeAllViews();
        content.addView(loadingCard("Loading campaigns..."));
        apiClient.get(token(), "/campaigns?pageSize=50", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                content.removeAllViews();
                JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONArray items = result.optJSONArray("items");
                if (items == null || items.length() == 0) {
                    content.addView(emptyPanel("No campaigns yet"));
                    return;
                }
                LinearLayout stack = new LinearLayout(MainActivity.this);
                stack.setOrientation(LinearLayout.VERTICAL);
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.optJSONObject(i);
                    if (item != null) {
                        stack.addView(campaignCard(item), stackItemParams());
                    }
                }
                content.addView(stack);
            }

            @Override
            public void onError(ApiException error) {
                renderError("Campaigns failed: " + error.getMessage(), () -> renderCampaigns());
            }
        });
    }

    private View campaignCard(JSONObject campaign) {
        LinearLayout card = card();
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout textStack = new LinearLayout(this);
        textStack.setOrientation(LinearLayout.VERTICAL);
        textStack.addView(text(campaign.optString("campaign_name", "Campaign"), 15, TEXT, Typeface.BOLD));
        String status = campaign.optString("status", "draft");
        int recipients = campaign.optInt("total_recipients", 0);
        textStack.addView(text(capitalize(status) + " - " + recipients + " recipients", 12, MUTED, Typeface.NORMAL));

        card.addView(textStack, new LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            1f
        ));

        Button button = secondaryButton(actionForStatus(status));
        button.setMinWidth(dp(78));
        if ("completed".equals(status) || "failed".equals(status)) {
            button.setEnabled(false);
        } else {
            button.setOnClickListener(v -> campaignAction(campaign));
        }
        card.addView(button, fixed(dp(88), dp(42)));
        return card;
    }

    private void campaignAction(JSONObject campaign) {
        int id = campaign.optInt("id", 0);
        String status = campaign.optString("status", "draft");
        if (id <= 0) {
            return;
        }
        String path = ("running".equals(status) || "sending".equals(status))
            ? "/campaigns/" + id + "/pause"
            : "/campaigns/" + id + "/start";
        toast("Updating campaign...");
        apiClient.post(token(), path, new JSONObject(), new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                toast("Campaign updated");
                renderCampaigns();
            }

            @Override
            public void onError(ApiException error) {
                toast(error.getMessage());
            }
        });
    }

    private void renderContacts(String search) {
        content.removeAllViews();

        LinearLayout searchPanel = panel();
        searchPanel.addView(label("Search"));
        EditText searchInput = input("name, email, company", search, false);
        searchPanel.addView(searchInput, matchHeight(dp(48)));
        searchPanel.addView(space(10));
        Button searchButton = actionButton("Search", BLUE);
        searchPanel.addView(searchButton, matchHeight(dp(46)));
        content.addView(searchPanel);

        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        content.addView(withTopMargin(list, 12));

        searchButton.setOnClickListener(v -> loadContacts(searchInput.getText().toString(), list));
        loadContacts(search, list);
    }

    private void loadContacts(String search, LinearLayout list) {
        list.removeAllViews();
        list.addView(loadingCard("Loading contacts..."));
        String path = "/contacts?pageSize=50";
        if (!search.trim().isEmpty()) {
            try {
                path += "&search=" + URLEncoder.encode(search.trim(), "UTF-8");
            } catch (Exception ignored) {
                path += "&search=" + search.trim();
            }
        }

        apiClient.get(token(), path, new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                list.removeAllViews();
                JSONObject result = data instanceof JSONObject ? (JSONObject) data : new JSONObject();
                JSONArray items = result.optJSONArray("items");
                if (items == null || items.length() == 0) {
                    list.addView(emptyPanel("No contacts found"));
                    return;
                }
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.optJSONObject(i);
                    if (item != null) {
                        list.addView(contactCard(item), stackItemParams());
                    }
                }
            }

            @Override
            public void onError(ApiException error) {
                list.removeAllViews();
                list.addView(emptyPanel(error.getMessage()));
            }
        });
    }

    private View contactCard(JSONObject contact) {
        LinearLayout card = card();
        String name = (contact.optString("first_name", "") + " " + contact.optString("last_name", "")).trim();
        if (name.isEmpty()) {
            name = contact.optString("email", "Contact");
        }
        card.addView(text(name, 15, TEXT, Typeface.BOLD));
        card.addView(text(contact.optString("email", ""), 12, MUTED, Typeface.NORMAL));

        JSONArray tags = contact.optJSONArray("tags");
        if (tags != null && tags.length() > 0) {
            LinearLayout tagLine = new LinearLayout(this);
            tagLine.setOrientation(LinearLayout.HORIZONTAL);
            tagLine.setPadding(0, dp(8), 0, 0);
            for (int i = 0; i < Math.min(tags.length(), 4); i++) {
                JSONObject tag = tags.optJSONObject(i);
                if (tag != null) {
                    TextView chip = pill(tag.optString("tag_name", "Tag"), BLUE);
                    LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    params.setMargins(0, 0, dp(6), 0);
                    tagLine.addView(chip, params);
                }
            }
            card.addView(tagLine);
        }
        return card;
    }

    private void renderTags() {
        content.removeAllViews();
        content.addView(loadingCard("Loading tags..."));
        apiClient.get(token(), "/contacts/tags", new ApiCallback() {
            @Override
            public void onSuccess(Object data) {
                content.removeAllViews();
                JSONArray tags = data instanceof JSONArray ? (JSONArray) data : new JSONArray();
                if (tags.length() == 0) {
                    content.addView(emptyPanel("No tags yet"));
                    return;
                }
                content.addView(tagGrid(tags));
            }

            @Override
            public void onError(ApiException error) {
                renderError("Tags failed: " + error.getMessage(), () -> renderTags());
            }
        });
    }

    private View tagGrid(JSONArray tags) {
        LinearLayout grid = new LinearLayout(this);
        grid.setOrientation(LinearLayout.VERTICAL);
        for (int i = 0; i < tags.length(); i += 2) {
            LinearLayout row = row();
            row.addView(tagCard(tags.optJSONObject(i)), gridCardParams(true));
            if (i + 1 < tags.length()) {
                row.addView(tagCard(tags.optJSONObject(i + 1)), gridCardParams(false));
            } else {
                SpaceView placeholder = new SpaceView(this);
                row.addView(placeholder, gridCardParams(false));
            }
            grid.addView(row, stackItemParams());
        }
        return grid;
    }

    private View tagCard(JSONObject tag) {
        LinearLayout card = card();
        card.setMinimumHeight(dp(120));
        int color = parseColor(tag == null ? "" : tag.optString("color", ""), BLUE);
        TextView swatch = new TextView(this);
        swatch.setBackground(round(color, 10));
        card.addView(swatch, fixed(dp(28), dp(28)));
        card.addView(space(16));
        card.addView(text(tag == null ? "Tag" : tag.optString("tag_name", "Tag"), 15, TEXT, Typeface.BOLD));
        int count = tag == null ? 0 : tag.optInt("contact_count", 0);
        card.addView(text(count + " contacts", 12, MUTED, Typeface.NORMAL));
        return card;
    }

    private void renderError(String message, Runnable retry) {
        content.removeAllViews();
        LinearLayout panel = panel();
        panel.addView(text(message, 14, ROSE, Typeface.BOLD));
        panel.addView(space(12));
        Button retryButton = actionButton("Retry", BLUE);
        retryButton.setOnClickListener(v -> retry.run());
        panel.addView(retryButton, matchHeight(dp(46)));
        content.addView(panel);
    }

    private View metricGrid(View a, View b, View c, View d) {
        LinearLayout grid = new LinearLayout(this);
        grid.setOrientation(LinearLayout.VERTICAL);
        LinearLayout row1 = row();
        row1.addView(a, gridCardParams(true));
        row1.addView(b, gridCardParams(false));
        LinearLayout row2 = row();
        row2.addView(c, gridCardParams(true));
        row2.addView(d, gridCardParams(false));
        grid.addView(row1, stackItemParams());
        grid.addView(row2, stackItemParams());
        return grid;
    }

    private View metricCard(String label, String value) {
        LinearLayout card = card();
        card.setMinimumHeight(dp(110));
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.addView(text(label, 12, MUTED, Typeface.BOLD));
        TextView number = text(value, 28, TEXT, Typeface.BOLD);
        number.setPadding(0, dp(20), 0, 0);
        card.addView(number);
        return card;
    }

    private View campaignRow(JSONObject campaign) {
        LinearLayout row = row();
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(12), 0, dp(12));

        LinearLayout stack = new LinearLayout(this);
        stack.setOrientation(LinearLayout.VERTICAL);
        stack.addView(text(campaign.optString("campaign_name", "Campaign"), 14, TEXT, Typeface.BOLD));
        stack.addView(text(campaign.optInt("total_recipients", 0) + " recipients", 12, MUTED, Typeface.NORMAL));

        row.addView(stack, new LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            1f
        ));

        TextView dot = new TextView(this);
        int color = "scheduled".equals(campaign.optString("status")) ? AMBER : GREEN;
        dot.setBackground(round(color, 999));
        row.addView(dot, fixed(dp(12), dp(12)));
        return row;
    }

    private View loadingCard(String message) {
        LinearLayout panel = panel();
        panel.addView(text(message, 14, MUTED, Typeface.BOLD));
        return panel;
    }

    private View emptyPanel(String message) {
        LinearLayout panel = panel();
        panel.addView(text(message, 14, MUTED, Typeface.BOLD));
        return panel;
    }

    private LinearLayout panel() {
        LinearLayout panel = card();
        panel.setPadding(dp(16), dp(16), dp(16), dp(16));
        return panel;
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(14), dp(14), dp(14));
        card.setBackground(border(SURFACE, 12, LINE, 1));
        card.setElevation(dp(1));
        return card;
    }

    private TextView sectionTitle(String value) {
        TextView title = text(value, 16, TEXT, Typeface.BOLD);
        title.setPadding(0, 0, 0, dp(6));
        return title;
    }

    private TextView alertLine(String value) {
        TextView line = text(value, 13, MUTED, Typeface.NORMAL);
        line.setPadding(0, dp(4), 0, dp(4));
        return line;
    }

    private TextView label(String value) {
        TextView label = text(value, 12, MUTED, Typeface.BOLD);
        label.setPadding(0, 0, 0, dp(6));
        return label;
    }

    private TextView loginLabel(String value) {
        TextView label = text(value, 13, LOGIN_MUTED, Typeface.BOLD);
        label.setPadding(0, 0, 0, dp(7));
        return label;
    }

    private TextView text(String value, int sp, int color, int style) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setTypeface(Typeface.DEFAULT, style);
        view.setIncludeFontPadding(true);
        return view;
    }

    private TextView pill(String value, int color) {
        TextView view = text(value, 11, color, Typeface.BOLD);
        view.setGravity(Gravity.CENTER);
        view.setPadding(dp(8), dp(5), dp(8), dp(5));
        view.setBackground(translucent(color, 30, 999));
        return view;
    }

    private EditText input(String hint, String value, boolean password) {
        EditText input = new EditText(this);
        boolean multiline = hint.equals("Recipients") || hint.equals("Content");
        input.setText(value);
        input.setHint(hint);
        input.setTextColor(TEXT);
        input.setHintTextColor(MUTED);
        input.setTextSize(14);
        input.setPadding(dp(12), 0, dp(12), 0);
        input.setBackground(border(SURFACE_SOFT, 10, LINE, 1));
        if (password) {
            input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        } else if (multiline) {
            input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        } else {
            input.setInputType(InputType.TYPE_CLASS_TEXT);
        }
        input.setSingleLine(!multiline);
        return input;
    }

    private EditText loginInput(String hint, String value, boolean password) {
        EditText input = new EditText(this);
        input.setText(value);
        input.setHint(hint);
        input.setTextColor(Color.rgb(15, 23, 42));
        input.setHintTextColor(Color.rgb(100, 116, 139));
        input.setTextSize(16);
        input.setPadding(dp(14), 0, dp(14), 0);
        input.setSingleLine(true);
        input.setBackground(border(Color.rgb(248, 250, 252), 9, Color.rgb(226, 232, 240), 1));
        if (password) {
            input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        } else {
            input.setInputType(InputType.TYPE_CLASS_TEXT);
        }
        return input;
    }

    private Spinner spinner(List<String> values) {
        Spinner spinner = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
            this,
            android.R.layout.simple_spinner_item,
            values
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
        spinner.setBackground(border(SURFACE_SOFT, 10, LINE, 1));
        spinner.setPadding(dp(6), 0, dp(6), 0);
        return spinner;
    }

    private Button actionButton(String label, int color) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setTextSize(14);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(round(color, 10));
        return button;
    }

    private Button loginPrimaryButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setTextSize(16);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(gradient(INDIGO, Color.rgb(99, 102, 241), 10));
        return button;
    }

    private Button secondaryButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(TEXT);
        button.setTextSize(13);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(border(SURFACE_SOFT, 10, LINE, 1));
        return button;
    }

    private LinearLayout row() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        return row;
    }

    private View withTopMargin(View view, int topDp) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, dp(topDp), 0, 0);
        view.setLayoutParams(params);
        return view;
    }

    private View space(int dp) {
        View view = new View(this);
        view.setLayoutParams(new LinearLayout.LayoutParams(1, dp(dp)));
        return view;
    }

    private LinearLayout.LayoutParams gridCardParams(boolean left) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            1f
        );
        params.setMargins(left ? 0 : dp(5), 0, left ? dp(5) : 0, 0);
        return params;
    }

    private LinearLayout.LayoutParams stackItemParams() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, dp(10));
        return params;
    }

    private LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
    }

    private LinearLayout.LayoutParams matchHeight(int height) {
        return new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            height
        );
    }

    private LinearLayout.LayoutParams fixed(int width, int height) {
        return new LinearLayout.LayoutParams(width, height);
    }

    private FrameLayout.LayoutParams frameMatch() {
        return new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
    }

    private FrameLayout.LayoutParams bottomTabParams() {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM
        );
        params.setMargins(dp(10), 0, dp(10), dp(10));
        return params;
    }

    private GradientDrawable round(int color, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radiusDp));
        return drawable;
    }

    private GradientDrawable border(int color, int radiusDp, int strokeColor, int strokeDp) {
        GradientDrawable drawable = round(color, radiusDp);
        drawable.setStroke(dp(strokeDp), strokeColor);
        return drawable;
    }

    private GradientDrawable gradient(int startColor, int endColor, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[] {startColor, endColor}
        );
        drawable.setCornerRadius(dp(radiusDp));
        return drawable;
    }

    private GradientDrawable loginBackground() {
        return new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[] {
                Color.rgb(99, 102, 241),
                Color.rgb(226, 232, 240),
                Color.rgb(248, 250, 252)
            }
        );
    }

    private GradientDrawable translucent(int color, int alpha, int radiusDp) {
        int next = Color.argb(
            alpha,
            Color.red(color),
            Color.green(color),
            Color.blue(color)
        );
        return round(next, radiusDp);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private String token() {
        return sessionStore.getToken();
    }

    private String titleFor(String tab) {
        if ("send".equals(tab)) {
            return "Quick Send";
        }
        if ("campaigns".equals(tab)) {
            return "Campaigns";
        }
        if ("contacts".equals(tab)) {
            return "Contacts";
        }
        if ("tags".equals(tab)) {
            return "Contact Tags";
        }
        return "Dashboard";
    }

    private String userInitial() {
        String name = sessionStore.getUserName();
        if (name == null || name.trim().isEmpty()) {
            name = sessionStore.getUserEmail();
        }
        if (name == null || name.trim().isEmpty()) {
            return "C";
        }
        return name.trim().substring(0, 1).toUpperCase(Locale.US);
    }

    private void openAccountMenu() {
        String title = sessionStore.getUserEmail().isEmpty()
            ? "ChadMailer"
            : sessionStore.getUserEmail();
        String[] items = {"Refresh", "Logout"};
        new AlertDialog.Builder(this)
            .setTitle(title)
            .setItems(items, (dialog, which) -> {
                if (which == 0) {
                    selectTab(currentTab);
                } else {
                    sessionStore.clearAuth();
                    currentTab = "dashboard";
                    showLogin();
                }
            })
            .show();
    }

    private JSONArray recipientsArray(String raw) throws Exception {
        JSONArray array = new JSONArray();
        Set<String> emails = new LinkedHashSet<>();
        String[] parts = raw.split("[,;\\n\\r\\t ]+");
        for (String part : parts) {
            String email = part.trim().toLowerCase(Locale.US);
            if (!email.isEmpty()) {
                emails.add(email);
            }
        }
        for (String email : emails) {
            array.put(email);
        }
        return array;
    }

    private String joinLines(List<String> values) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                builder.append('\n');
            }
            builder.append(values.get(i));
        }
        return builder.toString();
    }

    private String formatNumber(int value) {
        return String.format(Locale.US, "%,d", value);
    }

    private String capitalize(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return value.substring(0, 1).toUpperCase(Locale.US) + value.substring(1);
    }

    private String actionForStatus(String status) {
        if ("running".equals(status) || "sending".equals(status)) {
            return "Pause";
        }
        if ("completed".equals(status)) {
            return "Done";
        }
        if ("failed".equals(status)) {
            return "Failed";
        }
        return "Start";
    }

    private int parseColor(String value, int fallback) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return fallback;
            }
            return Color.parseColor(value.trim());
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private void toast(String message) {
        Toast.makeText(this, message == null ? "Something went wrong" : message, Toast.LENGTH_LONG).show();
    }

    private static class SpaceView extends View {
        SpaceView(Activity activity) {
            super(activity);
        }
    }
}
