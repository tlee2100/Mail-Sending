# ChadMailer React Native

React Native/Expo rewrite of the existing Java Android prototype in `../AndroidApp`.

## Ported Flows

- Login and register through `/auth/login` and `/auth/register`.
- Dashboard overview from `/dashboard/overview`.
- Quick Send with sender accounts, templates, tag recipients, preview and send.
- Campaign list with start/pause actions.
- Contacts search.
- Tags list with contact counts.

## Run

Start the backend first:

```bash
cd ../../MailSendingBE
npm run dev
```

Install and run the mobile app:

```bash
cd ../Mail-Sending/ReactNativeApp
npm install
npm run android
```

Default API URL for the Android emulator:

```text
http://10.0.2.2:5000/api/v1
```

For a real phone, replace `10.0.2.2` with your computer LAN IP, for example:

```text
http://192.168.1.10:5000/api/v1
```

The legacy Java app is intentionally kept in `../AndroidApp` as a reference until the React Native app is fully accepted.
