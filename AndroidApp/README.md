# ChadMailer Android

Native Android prototype built in Java from the existing `MobileAppPrototype` layout.

## What it includes

- Login/register against the backend auth API.
- Dashboard tab: `/dashboard/overview` and recent campaigns.
- Quick Send tab: sender accounts, templates, tag recipients, preview/send email.
- Campaigns tab: list campaigns and start/pause actions.
- Contacts tab: search and list contacts with tags.
- Tags tab: list contact tags with contact counts.

## Run

1. Start the backend from `../../MailSendingBE`:

```bash
npm run dev
```

2. Open this `AndroidApp` folder in Android Studio and sync Gradle.

3. On the Android emulator, keep the default API URL:

```text
http://10.0.2.2:5000/api/v1
```

4. On a real Android phone, replace `10.0.2.2` with your computer LAN IP, for example:

```text
http://192.168.1.10:5000/api/v1
```

The backend must allow the phone/emulator to reach port `5000`.
