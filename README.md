# Admin Practice Lab

A browser-based sandbox for practicing day-to-day IT admin work in a **simulated** Microsoft 365 tenant: Microsoft 365 admin center, Entra ID, Intune, Exchange, and a virtual Windows laptop, all linked together.

**Live demo:** https://markplowwright.github.io/admin-practice-lab/

> This is a learning simulator. It does not connect to Microsoft, and all users, passwords, and domains in it are fake. Nothing you do here touches a real tenant.

## What you can practice

- **Onboarding:** create a user, assign a license (group-based licensing, usage location), add to groups, set MFA
- **Offboarding:** block sign-in, revoke sessions, convert or remove the mailbox, reclaim the license, wipe or retire the device
- **Compromised account response:** reset password, revoke sessions, review sign-in logs, check forwarding rules and mail flow rules
- **Least privilege:** Helpdesk Administrator vs Global Administrator
- **Intune:** Autopilot, compliance vs configuration policies, apps, retire/wipe, troubleshooting
- **Windows laptop:** join a device (Entra joined, registered, or local), sign in as admin, check `dsregcmd /status`, and see the result in Entra and Intune
- **Missions:** guided tasks that tell you which portal and menu path to use
- **(i) icons:** click for plain-English definitions, with Jamf and Google Admin equivalents

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Progress is saved in your browser's `localStorage`. Use the reset control in the lab to start over.

## Deploy to GitHub Pages

Settings > Pages > Source: **Deploy from a branch** > Branch: `main`, folder `/ (root)`.

## Project layout

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, vanilla JS, no dependencies) |
| `.nojekyll` | Tells Pages to serve files as-is |
| `LICENSE` | MIT |

## Disclaimer

Not affiliated with or endorsed by Microsoft. Portal layouts are approximations for practice, and real portals change often. Always confirm steps in Microsoft's current documentation before acting on a production tenant.
