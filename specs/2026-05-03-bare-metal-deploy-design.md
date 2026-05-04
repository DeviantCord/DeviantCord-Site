# Bare-metal deploy design — DeviantCord Site

**Date:** 2026-05-03
**Status:** Approved (brainstorming complete; implementation plan to follow)
**Author:** Michael Riley (with Claude Opus 4.7)

---

## 1. Background

The DeviantCord Site is a Docusaurus 3.5 documentation/marketing site (the
DeviantCord 4 homepage, blog, and overhauled docs). It is currently hosted on
**Platform.sh** (now branded *Upsun Fixed*) in the US-4 GCP region, configured via
`.platform.app.yaml` + `.platform/services.yaml` + `.platform/routes.yaml`.

We are migrating it off the PaaS to a self-hosted **Incus container on Rocky 10**,
fronted by **Caddy on the host machine** for TLS. CI/CD continues from GitLab,
shipping release artifacts over SSH from a project-dedicated GitLab runner that
also lives in its own Incus container.

The PaaS configuration we are replacing is:

| | Value |
| --- | --- |
| `type` | `nodejs:18` |
| `dependencies.nodejs.yarn` | `1.22.5` |
| `web.commands.start` | `yarn` then `yarn serve --port 8888 --host 0.0.0.0` |
| `hooks.build` | `yarn` then `yarn build` |
| `disk` | `2048` MB |
| `mounts` | none |
| `relationships` (services) | none (services.yaml is empty) |
| `crons` / `workers` | none |

Key implication: this project has **no database, no message queue, no shared
mutable state, no native modules, no TypeScript, and no environment variables
that influence the build or runtime**. All state lives in the static
`build/` directory produced by `docusaurus build`.

## 2. Goals

1. Replace the PaaS hosting with a fully self-hosted deploy on an Incus
   container, with no functional regression for end users.
2. Keep CI/CD on GitLab. Pushes to `main` build, ship, and atomically swap a
   new release with a short (~1–2 second) maintenance window.
3. Hold the runtime architecture as close to the PaaS layout as practical
   (port 8888, `docusaurus serve` as the runtime) so that operational mental
   models carry over and rollback is straightforward.
4. Use **no `sudo`** in the deploy script. Privileged actions (currently just
   `systemctl restart app.service`) are granted to the deploy user via
   **polkit** rather than a sudoers rule.
5. Keep the canonical host configuration (the `app` user, `/opt/app/` skeleton,
   `app.service` unit file, polkit rule, Caddy host config) **out of this
   repository** — they are part of the **Puppet contract** for the container.
   The repo carries reference copies of `app.service` and `deploy.sh` so that
   drift is easy to spot.
6. Retain the last 5 releases on disk for fast rollback.

## 3. Non-goals

- **Zero-downtime deploys.** A `systemctl stop` → symlink swap → `systemctl
  start` is acceptable for a docs site; the maintenance window is measured in
  seconds. Blue/green or rolling restarts are deliberately out of scope.
- **Provisioning the host or the container.** Bootstrap (creating the Incus
  container, installing Node 18, creating the `app` user, dropping the
  polkit rule, installing the canonical `app.service`, configuring Caddy on
  the host) is handled by **Puppet** outside this repo. This spec defines the
  *contract* Puppet must satisfy.
- **Changing the application itself.** Docusaurus content, theme, plugins are
  unchanged. The one in-tree change is fixing the placeholder `url` field in
  `docusaurus.config.js` (see Section 11).
- **Database migrations / data persistence wiring.** N/A — there is no
  database and nothing persists across deploys.
- **`yarn audit` / security scanning in CI.** This is a pure static-content
  site with no runtime user input handling; the audit's signal-to-noise
  ratio is poor. Can be added later if the surface area changes.
- **CDN / edge caching.** Out of scope; Caddy's defaults are sufficient.

## 4. Architecture

```
                    ┌─────────────────┐
                    │   GitLab CI     │
                    │   (deviantcord- │
                    │    site runner, │
                    │    own Incus    │
                    │    container,   │
                    │    shell        │
                    │    executor)    │
                    │   build → tar   │
                    │       │         │
                    │       ▼ rsync   │
                    │       ssh ──────┼──┐
                    └─────────────────┘  │ SSH (user=app, key from
                                         │  $DEPLOY_SSH_PRIVATE_KEY)
   Host                                  │
   ┌────────────────┐    HTTPS:443       ▼
   │  Caddy         │◄────users      ┌───────────────────────────┐
   │  (TLS for      │                │  Incus app container       │
   │  deviantcord   │   HTTP to      │  ┌──────────────────────┐  │
   │  .com)         │──────────────► │  │ app.service          │  │
   │                │   <ip>:8888    │  │ (systemd, User=app)  │  │
   └────────────────┘                │  │  ↓ ExecStart         │  │
                                     │  │ /usr/bin/node        │  │
                                     │  │  …docusaurus serve   │  │
                                     │  │  --host 0.0.0.0      │  │
                                     │  │  --port 8888         │  │
                                     │  │  --dir /opt/app/     │  │
                                     │  │   current/build      │  │
                                     │  └──────────────────────┘  │
                                     │  /opt/app/  (app:app, 2775) │
                                     └───────────────────────────┘
```

Components:

- **Caddy on the host** — terminates TLS for `deviantcord.com`, reverse-proxies
  HTTP to the bridged IP of the app container on port 8888. Caddy
  configuration is owned by Puppet on the host and is **not part of this
  repo**.
- **App container (Incus, Rocky 10)** — runs exactly one project-relevant
  systemd unit, `app.service`, which executes `docusaurus serve` directly via
  `node`. No nginx, no `yarn` invocation at runtime, no other processes.
- **GitLab runner container (Incus, Rocky 10)** — project-dedicated runner
  with the `deviantcord-site` tag, shell executor, with Node 18 + yarn
  pre-installed by Puppet. Builds the tarball, rsyncs it to the app
  container, and triggers `deploy.sh` over SSH.

Listening on `0.0.0.0:8888` (rather than a unix socket) is required because
Caddy on the host reaches the app container over the bridged network — there
is no shared `/run/` between host and container.

## 5. Directory layout (inside the app container)

```
/opt/app/                       2775 app:app          (Puppet-bootstrapped)
├── current ──▶ releases/<sha>  symlink, deploy swaps it atomically
├── releases/<sha>/             last 5 retained for rollback
│   ├── build/                  the static site (served by docusaurus serve)
│   ├── node_modules/           prod-only (devDeps pruned in CI)
│   ├── package.json
│   ├── yarn.lock
│   ├── docusaurus.config.js
│   ├── sidebars.js
│   ├── babel.config.js
│   └── deploy/                 deploy.sh + reference app.service (for diffing)
└── (no shared/ — nothing persists across deploys)
```

The release directory contains everything `docusaurus serve` needs to start:
the built static site (`build/`), the docusaurus CLI and its runtime
dependencies (`node_modules/` after dev-dep prune), and the config files
(`docusaurus.config.js`, `sidebars.js`, `babel.config.js`) that the CLI loads
on startup. Source content (`docs/`, `blog/`, `src/`, `static/`,
`deviantcord/`, `stock-docs/`) is **not shipped** because it is already baked
into `build/`.

## 6. Host prerequisites — the Puppet contract

The following must exist on the app container before the first deploy. These
are **not** managed by this repository.

| # | Resource | Specification |
| --- | --- | --- |
| 1 | User & group | `app:app`, system user, login shell `/bin/bash` (needs SSH for CI deploys) |
| 2 | `~app/.ssh/authorized_keys` | Mode 0600, owner `app:app`. Contains the public half of the GitLab CI `DEPLOY_SSH_PRIVATE_KEY` |
| 3 | `/opt/app/` | Mode 2775, owner `app:app`. Setgid bit ensures new files inherit group `app` |
| 4 | `/opt/app/releases/` | Mode 2775, owner `app:app`, created at bootstrap |
| 5 | `nodejs` | Node 18 installed system-wide (e.g., `dnf module install nodejs:18`). Provides `/usr/bin/node` |
| 6 | `/etc/systemd/system/app.service` | Canonical unit file, byte-identical to `deploy/app.service` in this repo. After install: `systemctl daemon-reload && systemctl enable app.service` |
| 7 | `/etc/polkit-1/rules.d/50-app.rules` | Allows user `app` to `start`/`stop`/`restart` `app.service` without password authentication |
| 8 | Caddy on host | Configured to reverse-proxy `https://deviantcord.com` → `http://<container-ip>:8888`. **Out of scope of this repo.** |

### 6.1 Sample polkit rule (for `deploy/README.md` reference)

```javascript
// /etc/polkit-1/rules.d/50-app.rules
polkit.addRule(function(action, subject) {
    if (action.id == "org.freedesktop.systemd1.manage-units" &&
        action.lookup("unit") == "app.service" &&
        subject.user == "app" &&
        (action.lookup("verb") == "start" ||
         action.lookup("verb") == "stop"  ||
         action.lookup("verb") == "restart")) {
        return polkit.Result.YES;
    }
});
```

## 7. Deploy ordering (`deploy/deploy.sh`)

CI rsyncs `release.tar.zst` to `/tmp/release-<sha>.tar.zst` on the app
container, then ssh's in and pipes `deploy/deploy.sh` to `bash -s` with
`RELEASE_SHA` exported in the environment. The script then performs:

1. **Unpack** — `mkdir -p /opt/app/releases/<sha>` and
   `tar --zstd --no-same-owner -xf /tmp/release-<sha>.tar.zst -C /opt/app/releases/<sha>`.
   `--no-same-owner` is critical: the SSH user is `app`, but tarball entries
   should not attempt to preserve a numeric uid/gid from the build host.
2. **Stop** — `systemctl stop app.service`. Begins the maintenance window.
3. **Atomic symlink swap** — `ln -sfn /opt/app/releases/<sha> /opt/app/current`.
   The `-n` flag is critical so that `ln` treats `/opt/app/current` as a file
   to overwrite, not a directory to write into. `ln -sfn` is atomic on Linux.
4. **Start** — `systemctl start app.service`. Ends the maintenance window.
   New requests now hit the new release.
5. **Prune** — In `/opt/app/releases/`, list directories newest-first,
   skip the first 5, `rm -rf` the rest.
6. **Cleanup** — `rm -f /tmp/release-<sha>.tar.zst`.

There is **no migrate step** (no database) and **no shared-dir symlinking**
(no persistent content across releases).

The maintenance window is approximately the time between steps 2 and 4: a
single `systemctl stop` plus a `ln -sfn` plus a `systemctl start`. In
practice, ~1–2 seconds.

## 8. Repository additions

```
.gitlab-ci.yml                                NEW (does not currently exist)
specs/
└── 2026-05-03-bare-metal-deploy-design.md   THIS DOCUMENT
plans/
└── 2026-05-03-bare-metal-deploy-plan.md     written after spec approval
deploy/
├── app.service                              reference systemd unit
├── deploy.sh                                on-container deploy script
└── README.md                                operator notes (Puppet contract,
                                              polkit rule, rollback, runner setup)
```

The existing `.platform/`, `.platform.app.yaml` files are kept in-tree until
the cutover is complete (rollback insurance), then removed in a follow-up
commit. They are explicitly **excluded from the deploy tarball** (see
Section 9.3).

## 9. Full file contents

### 9.1 `deploy/app.service`

```ini
[Unit]
Description=DeviantCord Site (Docusaurus serve)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=app
Group=app
WorkingDirectory=/opt/app/current
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/app/current/node_modules/.bin/docusaurus serve \
    --host 0.0.0.0 \
    --port 8888 \
    --no-open \
    --dir /opt/app/current/build
Restart=on-failure
RestartSec=2
KillMode=mixed
TimeoutStopSec=20

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/app
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Notes:

- `Type=simple` — `docusaurus serve` does not implement `sd_notify`.
- `Environment=NODE_ENV=production` — important for downstream library
  defaults even though Docusaurus itself doesn't significantly differ.
- The explicit `--dir /opt/app/current/build` is belt-and-braces:
  `docusaurus serve` defaults to `./build` relative to the working directory,
  but being explicit guards against future surprise.
- `ReadWritePaths=/opt/app` is needed because `docusaurus serve` may write
  cache files into the working directory; everything else is read-only via
  `ProtectSystem=strict`.

### 9.2 `deploy/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
: "${RELEASE_SHA:?RELEASE_SHA must be set in the environment}"

APP_ROOT=/opt/app
RELEASES="$APP_ROOT/releases"
NEW_RELEASE="$RELEASES/$RELEASE_SHA"
TARBALL="/tmp/release-$RELEASE_SHA.tar.zst"
KEEP_RELEASES=5

echo "==> Unpack release $RELEASE_SHA"
mkdir -p "$NEW_RELEASE"
tar --zstd --no-same-owner -xf "$TARBALL" -C "$NEW_RELEASE"

echo "==> Stop app.service (begin maintenance window)"
systemctl stop app.service

echo "==> Atomic symlink swap"
ln -sfn "$NEW_RELEASE" "$APP_ROOT/current"

echo "==> Start app.service (end maintenance window)"
systemctl start app.service

echo "==> Prune old releases (keep last $KEEP_RELEASES)"
( cd "$RELEASES"
  ls -1t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf -- )

echo "==> Cleanup tarball"
rm -f "$TARBALL"

echo "==> Deploy $RELEASE_SHA complete"
```

### 9.3 `.gitlab-ci.yml`

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  tags: [deviantcord-site]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    - yarn install --frozen-lockfile
    - yarn build
    - yarn install --production --frozen-lockfile
    - tar --zstd -cf release.tar.zst
        build/
        node_modules/
        package.json
        yarn.lock
        docusaurus.config.js
        sidebars.js
        babel.config.js
        deploy/
  artifacts:
    name: "release-$CI_COMMIT_SHORT_SHA"
    paths:
      - release.tar.zst
    expire_in: 1 month

deploy:
  stage: deploy
  tags: [deviantcord-site]
  needs: [build]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  before_script:
    - install -m 700 -d ~/.ssh
    - install -m 600 /dev/stdin ~/.ssh/id_ed25519 <<< "$DEPLOY_SSH_PRIVATE_KEY"
    - ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
  script:
    - export RELEASE_SHA="$CI_COMMIT_SHA"
    - rsync -az release.tar.zst "app@$DEPLOY_HOST:/tmp/release-$RELEASE_SHA.tar.zst"
    - ssh "app@$DEPLOY_HOST" "RELEASE_SHA=$RELEASE_SHA bash -s" < deploy/deploy.sh
  environment:
    name: production
    url: https://deviantcord.com
```

GitLab CI/CD variables required (all marked **Protected**):

| Variable | Value |
| --- | --- |
| `DEPLOY_HOST` | IP or DNS name of the app container reachable from the runner container |
| `DEPLOY_SSH_PRIVATE_KEY` | Private SSH key (ed25519); pubkey in `~app/.ssh/authorized_keys` |

The `main` branch must be marked **Protected** in GitLab so that only Protected
variables are exposed to deploy jobs.

The `tar` invocation in the `build` job uses an **explicit include list**
rather than an exclude list. This means the following items are omitted by
construction and never need to be excluded one-by-one:

- `.git/`, `.idea/`, `*.iml`, `README.md`
- `.platform/`, `.platform.app.yaml` (PaaS leftovers, kept in-tree until
  cutover but never shipped)
- `specs/`, `plans/`
- `src/`, `static/`, `docs/`, `blog/`, `deviantcord/`, `stock-docs/`
  (all source — already baked into `build/`)

Using an include list also means new top-level directories added to the repo
in the future will not silently leak into the deploy artifact — the build
job has to be updated to ship them, which forces a deliberate decision.

### 9.4 `deploy/README.md` (outline — full text written in implementation)

Contents:

1. **What this deploys** — one-paragraph summary.
2. **Architecture diagram** — same as Section 4 above.
3. **The Puppet contract** — verbatim copy of Section 6 (so it's discoverable
   from the repo, not just this spec).
4. **Sample polkit rule** — Section 6.1.
5. **GitLab variables required** — Section 9.3 table.
6. **Manual rollback procedure** — `ln -sfn /opt/app/releases/<old-sha>
   /opt/app/current && systemctl restart app.service`.
7. **Smoke checks after deploy** — `systemctl status app.service`,
   `curl -sSf http://localhost:8888/`, expected response.
8. **What's deliberately NOT in this repo** — Caddy host config, container
   bootstrap, polkit rule install (all Puppet).

## 10. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | `docusaurus serve` cache writes break `ProtectSystem=strict` | Medium | Service won't start | `ReadWritePaths=/opt/app` covers the working directory. Verify with `systemctl status app.service` after first deploy; loosen if needed |
| R2 | `node_modules/` ABI mismatch between runner and app container | Very low | Runtime crash | All deps are pure JS (no native modules); risk is essentially zero. Documented as such |
| R3 | First deploy fails because Puppet contract isn't satisfied | Medium | First deploy aborts | `deploy/README.md` documents the contract explicitly; pre-push checklist requires confirmation |
| R4 | Polkit rule too narrow / too broad | Low | Deploy fails / unintended privilege | Rule scopes to `app.service` + verb whitelist. Reviewed in Section 6.1 |
| R5 | Lost release directory (manually deleted) breaks `current` symlink | Low | Site goes 502 until next deploy | Symlink swap is atomic; `current` only points at directories that exist after step 5 of `deploy.sh` |
| R6 | Build failure on `main` after merge — site keeps serving the old release | Low | No new content shipped | This is desired: `current` is only updated on success. CI failure visible in GitLab |
| R7 | `--dir /opt/app/current/build` resolves through the symlink at startup, then `current` swaps and the running process holds an FD into the old release | Medium | Old release directory cannot be pruned while service is up | Service is fully stopped before swap, so no lingering FDs. Pruning runs after `systemctl start` so the new process has already opened the new build dir |
| R8 | SSH key compromise on GitLab runner | Low | Attacker can deploy arbitrary content | `app` user has limited container privileges; polkit rule scoped to `app.service` only; no shell escape via `bash -s` (script is fixed in repo, not constructed from CI variables) |
| R9 | `yarn install --production` after `yarn build` leaves the build artifact stale | Low | Old `build/` shipped | `tar` runs after the prune step; `build/` is the output of `yarn build` and is not modified by `yarn install --production`. Verified by ordering in 9.3 |

## 11. Notes carried into implementation

These are not open questions — each has a decided answer recorded here so
the implementation plan and the operator have the full picture.

1. **`docusaurus.config.js` `url` field (in-scope)** — Currently set to the
   placeholder `https://your-docusaurus-test-site.com`. Will be updated to
   `https://deviantcord.com` as part of this work (it affects build output:
   sitemaps, canonical URLs, og:url). This is the only in-tree
   application-code change in this work.
2. **PaaS file removal** — `.platform/` and `.platform.app.yaml` are kept in
   the repo until the bare-metal deploy is verified working end-to-end. A
   follow-up commit (tracked separately, not part of this spec's
   implementation plan) will remove them.
3. **First-deploy bootstrap** — On the very first run, `/opt/app/current` does
   not yet exist; `app.service` will be in a stopped state. The first
   `deploy.sh` invocation will create `releases/<sha>/`, then attempt
   `systemctl stop app.service` (a no-op on a stopped service — succeeds),
   then create the symlink, then start. No special-casing needed.
4. **Container IP discovery** — `DEPLOY_HOST` must be set to a stable address
   (Incus static IP assignment, internal DNS entry, or `/etc/hosts` entry on
   the runner container). This is part of the Puppet contract for the
   networking layer but worth flagging here.

## 12. Pre-push checklist (carried to the implementation phase)

Before the user pushes the implementation commits:

- [ ] Puppet has provisioned the container per Section 6 (user, paths,
      polkit rule, `app.service` installed and enabled, Node 18 present)
- [ ] Caddy on the host is configured to reverse-proxy `deviantcord.com` →
      `<container-ip>:8888` and has a valid certificate
- [ ] GitLab variables `DEPLOY_HOST`, `DEPLOY_SSH_PRIVATE_KEY` are set as
      Protected
- [ ] `main` is marked Protected in GitLab
- [ ] The runner with tag `deviantcord-site` is registered and has Node 18
      + yarn available
- [ ] `~app/.ssh/authorized_keys` on the container contains the pubkey
      paired with `DEPLOY_SSH_PRIVATE_KEY`
- [ ] DNS for `deviantcord.com` is ready to cut over (or is already on the
      new host)
