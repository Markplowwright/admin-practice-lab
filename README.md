# Admin Practice Lab

Practice real Microsoft 365 admin work with nothing to break. A browser-based simulator of the Microsoft 365 admin center, Entra ID, Intune, Exchange, and a virtual Windows laptop, all linked together. No tenant, no sign-up, no install.

**Try it now:** https://markplowwright.github.io/admin-practice-lab/

<!-- Add a screenshot or GIF here once you have one:
![Admin Practice Lab](docs/screenshot.png)
-->

> This is a learning simulator. It does not connect to Microsoft, and all users, passwords, and domains in it are fake. Nothing you do here touches a real tenant.

## Who it's for

People who want to learn IT admin tasks before they have access to a real tenant: help desk and IT support beginners, career changers, and admins coming from Jamf or Google Admin who are learning Entra ID and Intune.

## How it works

The first time you open it, a 3-minute tour explains the five places you'll work and how missions work (or skip it). Then you follow a four-level path in the **Lab guide**:

| Level | What you practice |
|---|---|
| 1. Onboarding | Prepare Intune for new laptops, onboard a new hire (usage location, license, groups, Autopilot laptop), license by group |
| 2. Offboarding | Block sign-in, revoke sessions, hand off OneDrive files, reclaim the license and laptop, apply least privilege |
| 3. Compromised accounts and MFA | Contain a compromised account (password, sessions, rogue phone number, mail forwarding), roll out MFA with Conditional Access |
| 4. Intune and laptops | BitLocker disk encryption vs compliance, app deployment, Autopilot setup and enrollment errors, joining a laptop by hand and checking `dsregcmd /status` |

There are 11 missions and 43 steps. Every step names the portal and the menu path and has a **Go there** button. A step is checked off when you actually do it in the lab, and when you finish a mission the guide explains **why it works that way**.

## Coming from Jamf or Google Admin?

Click the **i** icons for plain-English definitions with Jamf and Google Admin equivalents, open the **Jamf / Google** tab in the guide for a concept-by-concept translation, and read the short comparison at the end of each completed mission. The mappings are approximate because each product splits the work differently.

## Realistic failures

Enrollment can fail the way it does in a real tenant: a blocked account, a user outside the MDM user scope, a missing license (error 80180018), or device join disabled (error 801c0003). A joined but unmanaged device is fixed by correcting the scope or license and then syncing.

## Run it locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Progress is saved in your browser's `localStorage`, so it stays on that browser and device. Use **Reset lab** in the guide to start over, or **Replay the tour** to see the intro again.

## Deploy to GitHub Pages

Settings > Pages > Source: **Deploy from a branch** > Branch: `main`, folder `/ (root)`.

## Known limitations

- It is a simulator. Layouts approximate the real portals, which change often, so confirm steps in Microsoft's current documentation before acting on a production tenant.
- Progress is stored only in your browser. Clearing site data resets it.
- Not every real setting exists here. The lab covers the common admin tasks above, not the full product surface.
- Not affiliated with or endorsed by Microsoft, Jamf, or Google.

## Project layout

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, vanilla JS, no dependencies, no backend) |
| `LICENSE` | MIT |

## Disclaimer

Not affiliated with or endorsed by Microsoft. Portal layouts are approximations for practice, and real portals change often. Always confirm steps in Microsoft's current documentation before acting on a production tenant.
