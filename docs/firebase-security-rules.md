# Firebase Security Rules (Firestore)

## Data Model
- Collection: `alerts`
- Fields: `createdAt`, `deviceId`, `alertType`, `message`, `complaintStatus`, `heartbeatBpm`, `soundLevel`

## Recommended Access Model
- Victim dashboard users authenticate with Firebase Auth.
- Admin/responders have custom claim: `role = admin`.
- Raspberry Pi writes through a backend service credential (Python `firebase-admin`), not client SDK rules.

## Firestore Rules

## Demo Rules (for Remote Simulator + Dashboard Without Auth)

Use this only for development/testing while you do not have Raspberry Pi hardware online.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{alertId} {
      allow read: if true;
      allow create: if
        request.resource.data.createdAt is int &&
        request.resource.data.deviceId is string &&
        request.resource.data.alertType is string &&
        request.resource.data.message is string &&
        request.resource.data.complaintStatus is string;
      allow update, delete: if false;
    }

    match /telemetry/live {
      allow read: if true;
      allow write: if
        request.resource.data.updatedAt is int &&
        request.resource.data.deviceId is string &&
        request.resource.data.heartbeatBpm is int &&
        request.resource.data.soundDb is int;
    }
  }
}
```

## Production Rules (Auth + Role Based)

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
