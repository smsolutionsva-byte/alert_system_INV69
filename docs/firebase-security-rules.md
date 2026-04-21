# Firebase Security Rules (Firestore)

## Data Model
- Collection: `alerts`
- Fields: `createdAt`, `deviceId`, `alertType`, `message`, `complaintStatus`, `heartbeatBpm`, `soundLevel`

## Recommended Access Model
- Victim dashboard users authenticate with Firebase Auth.
- Admin/responders have custom claim: `role = admin`.
- Raspberry Pi writes through a backend service credential (Python `firebase-admin`), not client SDK rules.

## Firestore Rules

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.token.role == 'admin';
    }

    match /alerts/{alertId} {
      // Victim/admin can read their own tenant/device alerts.
      allow read: if isSignedIn() &&
        (isAdmin() || resource.data.deviceId == request.auth.token.deviceId);

      // Direct client writes blocked; server-side admin SDK writes bypass rules.
      allow create, update, delete: if false;
    }
  }
}
```

## Extra Hardening
- Enable App Check for web clients.
- Rotate service account keys and store only on secured Pi filesystem.
- Use Firebase Auth MFA for admin accounts.
- Add Cloud Function for complaint-status updates with audit logging.
- Enable Firestore backups and access logs.
