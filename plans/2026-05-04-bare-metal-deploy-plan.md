# Bare-metal deploy implementation plan — DeviantCord Site

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the artifacts needed to deploy the DeviantCord Site to a self-hosted Incus container on Rocky 10, fronted by Caddy on the host, replacing the current Upsun Fixed (Platform.sh) hosting.

**Architecture:** GitLab CI builds the static site with `yarn build`, prunes devDeps with `yarn install --production`, packages a tarball with an explicit include list, rsyncs it to the app container's `/tmp/`, then SSHes in as the `app` user and pipes `deploy/deploy.sh` to `bash -s` with `RELEASE_SHA` exported. The script unpacks into `/opt/app/releases/<sha>/`, atomically swaps `/opt/app/current`, and restarts a system-level `app.service` systemd unit (which runs `docusaurus serve` directly via `node`). Polkit grants the `app` user permission to manage just `app.service` so no `sudo` is required. The Puppet contract for the container (user, paths, polkit rule, systemd unit install, Node 18 install, Caddy config) is documented in `deploy/README.md` but lives outside this repo.

**Tech Stack:** Bash, systemd, GitLab CI YAML, Docusaurus 3.5 (Node 18, Yarn 1.22), Incus (LXC fork), Polkit, Caddy.

**Spec:** `specs/2026-05-03-bare-metal-deploy-design.md`

**Workflow rules:**
- Hold ALL implementation commits LOCALLY. Do not push during implementation.
- One commit per task.
- Per task: do the work → spec compliance review → code quality review → checkpoint with user.
- Final cross-implementation review before any push.

---

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `deploy/app.service` | create | Reference systemd unit. Puppet installs the canonical copy at `/etc/systemd/system/app.service`; this file is for diffing and version control. |
| `deploy/deploy.sh` | create (mode 0755) | On-container orchestration. Receives `RELEASE_SHA` env var, unpacks tarball, swaps symlink, restarts service, prunes old releases. No `sudo`. |
| `.gitlab-ci.yml` | create | Two-stage pipeline: `build` (yarn install + build + prune + tarball) and `deploy` (rsync + ssh deploy.sh). Runs only on default branch. |
| `deploy/README.md` | create | Operator notes: Puppet contract, sample polkit rule, GitLab variables required, manual rollback procedure, smoke checks. No Caddyfile sample (handled separately on host). |
| `docusaurus.config.js` | modify line 14 | Replace placeholder `url: 'https://your-docusaurus-test-site.com'` with `url: 'https://deviantcord.com'`. Affects baked-in sitemap, canonical, og:url. |

No test files — this is infrastructure code. Each task uses a verification step appropriate to the file type (`systemd-analyze verify`, `bash -n`, Python YAML parse, code-fence count, `yarn build` smoke).

---

## Task 1: Create `deploy/app.service` reference unit

**Files:**
- Create: `deploy/app.service`

- [ ] **Step 1: Create the unit file**

Write the following to `deploy/app.service`:

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
ExecStart=/usr/bin/node /opt/app/current/node_modules/.bin/docusaurus serve --host 0.0.0.0 --port 8888 --no-open --dir /opt/app/current/build
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

Notes for the implementer (do NOT include in the file):
- `ExecStart` is one logical line, no backslash continuations. Easier for `systemd-analyze` and grep tooling.
- `ReadWritePaths=/opt/app` is required because `ProtectSystem=strict` makes `/opt` read-only by default; `docusaurus serve` may write nothing today but the working directory should be writable to be safe.
- `Type=simple` because `docusaurus serve` does not call `sd_notify`.

- [ ] **Step 2: Verify the unit syntactically**

Run: `systemd-analyze verify deploy/app.service`

Expected: exit code 0, no output. (Some warnings about absolute paths or directives may appear; those are acceptable. Hard errors will print to stderr and return non-zero.)

If `systemd-analyze` complains that the unit file is not in `/etc/systemd/system/` or about missing `[Install]` targets when run on a non-installed file, that is a known limitation — the warning is harmless. The check we care about is that there are no syntax errors.

- [ ] **Step 3: Sanity-check the ExecStart resolves to a real binary path pattern**

Run: `grep -E '^ExecStart=/usr/bin/node ' deploy/app.service`

Expected: one matching line. (`/usr/bin/node` is what Rocky 10's `dnf module install nodejs:18` provides.)

- [ ] **Step 4: Commit**

```bash
git add deploy/app.service
git commit -m "Add reference systemd unit for app.service

Reference copy of the systemd unit that Puppet installs as the
canonical /etc/systemd/system/app.service on the app container.
Runs docusaurus serve directly via /usr/bin/node, listens on
0.0.0.0:8888 (so Caddy on the host can reach it via the container
bridge IP), and uses standard hardening directives (NoNewPrivileges,
ProtectSystem=strict, etc).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create `deploy/deploy.sh`

**Files:**
- Create: `deploy/deploy.sh` (mode 0755)

- [ ] **Step 1: Create the script**

Write the following to `deploy/deploy.sh`:

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

- [ ] **Step 2: Make it executable**

Run: `chmod 0755 deploy/deploy.sh`

Verify: `stat -c '%a' deploy/deploy.sh`

Expected: `755`

- [ ] **Step 3: Bash syntax check**

Run: `bash -n deploy/deploy.sh`

Expected: exit code 0, no output. (Any syntax error would print to stderr and exit non-zero.)

- [ ] **Step 4: Verify the missing-RELEASE_SHA guard works**

Run: `unset RELEASE_SHA; bash deploy/deploy.sh; echo "exit=$?"`

Expected: prints `deploy/deploy.sh: line 3: RELEASE_SHA: RELEASE_SHA must be set in the environment` (or similar) on stderr, then `exit=1`. The script must NOT proceed past line 3.

If you accidentally have `RELEASE_SHA` set in your shell, also check the negative case:

Run: `RELEASE_SHA="" bash deploy/deploy.sh; echo "exit=$?"`

Expected: same as above — empty string also triggers the guard because of the `:?` operator.

- [ ] **Step 5: Confirm the script does NOT contain `sudo`**

Run: `grep -n sudo deploy/deploy.sh; echo "grep_exit=$?"`

Expected: `grep_exit=1` (no matches). If any match prints, this is a spec violation — the design requires polkit, not sudo.

- [ ] **Step 6: Commit**

```bash
git add deploy/deploy.sh
git commit -m "Add deploy/deploy.sh on-container orchestration

Triggered by CI over SSH with RELEASE_SHA exported. Unpacks the
tarball into /opt/app/releases/<sha>/, atomically swaps the
/opt/app/current symlink, restarts app.service via polkit-granted
systemctl (no sudo), and prunes to the last 5 releases. Bails
immediately if RELEASE_SHA is unset or empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create `.gitlab-ci.yml` with the build stage

**Files:**
- Create: `.gitlab-ci.yml`

This task adds only the `build` job. The `deploy` job is added in Task 4 — splitting them keeps the YAML diff small and verifiable per stage.

- [ ] **Step 1: Create the file with stages + build job only**

Write the following to `.gitlab-ci.yml`:

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
```

Note: the `tar` command is on a single logical YAML line via folding (the items after `tar --zstd -cf release.tar.zst` are on indented continuation lines, which YAML's flow-script-block-scalar joins with spaces). This is the same pattern GitLab itself recommends for long shell commands.

- [ ] **Step 2: YAML parse check**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.gitlab-ci.yml')); print('top-level keys:', sorted(d.keys()))"`

Expected: `top-level keys: ['build', 'stages']` (sorted alphabetically).

- [ ] **Step 3: Verify the build script joined the tar args correctly**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.gitlab-ci.yml')); print(d['build']['script'][3])"`

Expected: a single string starting with `tar --zstd -cf release.tar.zst build/ node_modules/ package.json yarn.lock docusaurus.config.js sidebars.js babel.config.js deploy/` (with single spaces between args).

If the output contains literal `\n` (newlines) inside the string, YAML did not fold the lines — re-check the indentation of the continuation lines (each continuation line must be indented MORE than the first line of the script item).

- [ ] **Step 4: Verify the build job is restricted to the default branch**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.gitlab-ci.yml')); print(d['build']['rules'])"`

Expected: `[{'if': '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'}]`

- [ ] **Step 5: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "Add .gitlab-ci.yml build stage

Yarn install + docusaurus build + dev-dep prune, then tar with an
explicit include list (build/, node_modules/, package.json,
yarn.lock, the three config files docusaurus serve loads, and the
deploy/ directory which carries deploy.sh + the reference unit).
Only runs on the default branch. Tarball uploaded as the build
artifact for the deploy job.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add the deploy job to `.gitlab-ci.yml`

**Files:**
- Modify: `.gitlab-ci.yml` (append the `deploy:` job)

- [ ] **Step 1: Append the deploy job**

Append the following to the end of `.gitlab-ci.yml` (preserving the existing `stages:` and `build:` blocks):

```yaml

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

- [ ] **Step 2: YAML parse check**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.gitlab-ci.yml')); print('top-level keys:', sorted(d.keys()))"`

Expected: `top-level keys: ['build', 'deploy', 'stages']`

- [ ] **Step 3: Verify the deploy job has the right shape**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.gitlab-ci.yml'))['deploy']; print('stage=', d['stage']); print('needs=', d['needs']); print('environment=', d['environment'])"`

Expected:
```
stage= deploy
needs= ['build']
environment= {'name': 'production', 'url': 'https://deviantcord.com'}
```

- [ ] **Step 4: Verify the SSH user is `app`, not `deploy` or other**

Run: `grep -n 'app@\$DEPLOY_HOST' .gitlab-ci.yml | wc -l`

Expected: `2` (one for the rsync line, one for the ssh line).

- [ ] **Step 5: Confirm no plaintext secrets in the file**

Run: `grep -nE '(BEGIN OPENSSH|BEGIN RSA|BEGIN EC|ssh-(ed25519|rsa|ecdsa))' .gitlab-ci.yml; echo "grep_exit=$?"`

Expected: `grep_exit=1` (no matches). All secrets must come from GitLab CI variables, never inline.

- [ ] **Step 6: Commit**

```bash
git add .gitlab-ci.yml
git commit -m "Add .gitlab-ci.yml deploy stage

Rsyncs the build tarball to /tmp/ on the app container as the
'app' user, then pipes deploy/deploy.sh into bash -s with
RELEASE_SHA exported. SSH key comes from the protected
DEPLOY_SSH_PRIVATE_KEY variable; host fingerprint is captured at
job start with ssh-keyscan. Marks the production environment with
the deviantcord.com URL so GitLab's environment dashboard tracks
deploys.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Create `deploy/README.md` (operator notes)

**Files:**
- Create: `deploy/README.md`

- [ ] **Step 1: Create the README**

Write the following to `deploy/README.md`:

````markdown
# Deploy notes — DeviantCord Site

This directory carries the artifacts that travel with the application: the
`deploy.sh` orchestration script and a reference copy of the systemd unit.
The canonical host-side configuration lives in Puppet, not in this repo.

## What this deploys

A Docusaurus 3.5 static site, served by `docusaurus serve` running under
systemd inside an Incus container on Rocky 10. Caddy on the host terminates
TLS for `https://deviantcord.com` and reverse-proxies to the container's
bridged IP on port 8888.

## Architecture

```
                    ┌─────────────────┐
                    │   GitLab CI     │
                    │   build → tar   │
                    │       ssh ──────┼──┐
                    └─────────────────┘  │ SSH (user=app)
   Host                                  │
   ┌────────────────┐    HTTPS:443       ▼
   │  Caddy         │◄──users    ┌─────────────────────────┐
   │  (deviantcord  │            │  Incus app container    │
   │  .com)         │── HTTP:8888│  app.service (systemd)  │
   │                │──────────► │   → docusaurus serve    │
   └────────────────┘            │  /opt/app/ (app:app)    │
                                 └─────────────────────────┘
```

## Puppet contract

The following must be provisioned on the app container before the first
deploy. None of it is managed by this repo.

| # | Resource | Specification |
| --- | --- | --- |
| 1 | User & group | `app:app`, system user, login shell `/bin/bash` (needs SSH for CI deploys) |
| 2 | `~app/.ssh/authorized_keys` | Mode 0600, owner `app:app`. Contains the public half of the GitLab CI `DEPLOY_SSH_PRIVATE_KEY` |
| 3 | `/opt/app/` | Mode 2775, owner `app:app`. Setgid bit ensures new files inherit group `app` |
| 4 | `/opt/app/releases/` | Mode 2775, owner `app:app`, created at bootstrap |
| 5 | Node.js 18 | Installed system-wide (`dnf module install nodejs:18`). Provides `/usr/bin/node` |
| 6 | `/etc/systemd/system/app.service` | Byte-identical to `deploy/app.service` in this repo. After install: `systemctl daemon-reload && systemctl enable app.service` |
| 7 | `/etc/polkit-1/rules.d/50-app.rules` | Allows user `app` to `start`/`stop`/`restart` `app.service` without password (see below) |
| 8 | Caddy on host | Reverse-proxy for `https://deviantcord.com` → `http://<container-ip>:8888`. Out of scope of this repo. |

## Sample polkit rule

Install at `/etc/polkit-1/rules.d/50-app.rules`:

```javascript
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

After installing or modifying the rule, restart polkit:

```
systemctl restart polkit
```

To verify the rule works (run as the `app` user):

```
systemctl restart app.service && echo OK
```

Expected: `OK`. If polkit prompts for authentication, the rule has not loaded
or does not match.

## GitLab CI variables required

All must be set as **Protected** variables on the GitLab project, and
`main` must be marked as a Protected branch.

| Variable | Value |
| --- | --- |
| `DEPLOY_HOST` | IP or DNS name of the app container reachable from the runner container |
| `DEPLOY_SSH_PRIVATE_KEY` | Private SSH key (ed25519); pubkey installed in `~app/.ssh/authorized_keys` on the container |

## Manual rollback procedure

To roll back to a previous release without involving CI:

1. SSH into the app container as the `app` user.
2. List available releases:
   ```
   ls -1t /opt/app/releases/
   ```
3. Identify the release SHA you want to roll back to (call it `<old-sha>`).
4. Atomically swap the symlink and restart:
   ```
   ln -sfn /opt/app/releases/<old-sha> /opt/app/current
   systemctl restart app.service
   ```
5. Confirm the service is up:
   ```
   systemctl status app.service
   curl -sSf http://localhost:8888/ | head -5
   ```

The previous (broken) release directory is still in `releases/` and can be
removed manually if desired, OR left in place — it will age out the next
time `deploy.sh` runs and prunes to the most recent 5.

## Smoke checks after deploy

Run on the app container after CI reports success:

```
systemctl status app.service
journalctl -u app.service -n 30 --no-pager
curl -sSf http://localhost:8888/ | head -5
```

Expected:
- `systemctl status` shows `active (running)`.
- `journalctl` shows a startup line from `docusaurus serve` and no errors.
- `curl` returns the homepage HTML (starts with `<!DOCTYPE html>`).

From the host, verify Caddy reaches the container:

```
curl -sSfI https://deviantcord.com/ | head -3
```

Expected: HTTP 200, content-type `text/html`.

## What is NOT in this repo

- The Caddy host configuration (Puppet on the host)
- The Incus container definition itself (Puppet)
- The `app` user, `/opt/app/` skeleton, polkit rule install, `app.service`
  install (Puppet, on the container)
- Node 18 install on the container (Puppet)
- DNS for `deviantcord.com` (DNS provider, out of scope)
````

- [ ] **Step 2: Verify markdown code-fence balance**

Each opening fence must have a matching closing fence. The README uses both ``` (triple backtick) and ```` (quadruple backtick — for the outer wrapper that contains nested triple-backtick blocks). Count both.

Run:
```bash
python3 - <<'PY'
text = open('deploy/README.md').read()
import re
quadruple = len(re.findall(r'^````', text, re.M))
triple = len(re.findall(r'^```(?!`)', text, re.M))
print(f"quadruple-fence count = {quadruple}")
print(f"triple-fence count    = {triple}")
print(f"quadruple OK = {quadruple % 2 == 0}")
print(f"triple OK    = {triple % 2 == 0}")
PY
```

Expected: both counts are even, both "OK" lines say `True`. If either is odd, you have an unmatched fence — find and fix it.

- [ ] **Step 3: Verify there is no Caddyfile sample (per the spec)**

Run: `grep -niE '(caddyfile|reverse_proxy|tls .*deviantcord)' deploy/README.md; echo "grep_exit=$?"`

Expected: `grep_exit=1` (no matches). The user explicitly excluded the Caddyfile sample from this README; Caddy lives on the host and is configured outside this repo.

(Note: the README does mention Caddy conceptually — that's fine. The check is for actual configuration content like `reverse_proxy` or a `tls` directive.)

- [ ] **Step 4: Verify the polkit rule is present and references the right unit**

Run: `grep -n '"unit") == "app.service"' deploy/README.md`

Expected: one matching line.

- [ ] **Step 5: Commit**

```bash
git add deploy/README.md
git commit -m "Add deploy/README.md operator notes

Documents the Puppet contract for the app container (user, paths,
polkit rule, app.service install, Node 18, Caddy reverse-proxy on
host), the required GitLab CI variables, the manual rollback
procedure (atomic symlink swap to a prior release SHA), and the
smoke checks to run after deploy. Caddyfile content is intentionally
excluded — Caddy lives on the host and is configured separately.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Update `docusaurus.config.js` URL field

**Files:**
- Modify: `docusaurus.config.js:14`

This is the only application-code change in this work. The `url` field is baked into the build (sitemaps, canonical URLs, og:url), so it must be correct before the new deploy goes live.

- [ ] **Step 1: Inspect the current value to confirm what's there**

Run: `grep -n "url:" docusaurus.config.js`

Expected: a line like `  url: 'https://your-docusaurus-test-site.com',` near the top of the config object. Capture the exact line text for the next step.

- [ ] **Step 2: Replace the placeholder with the real URL**

In `docusaurus.config.js`, change line 14 from:
```javascript
  url: 'https://your-docusaurus-test-site.com',
```
to:
```javascript
  url: 'https://deviantcord.com',
```

- [ ] **Step 3: Verify the change**

Run: `grep -n "url:" docusaurus.config.js`

Expected: a line `  url: 'https://deviantcord.com',`. The placeholder string `your-docusaurus-test-site` must NOT appear anywhere in the file.

Run: `grep -c "your-docusaurus-test-site" docusaurus.config.js; echo "grep_exit=$?"`

Expected: `0` and `grep_exit=1` (no matches).

- [ ] **Step 4: Smoke-build to confirm the config still parses and Docusaurus accepts the URL**

Run: `yarn install --frozen-lockfile && yarn build`

Expected: build completes successfully. Look for these specific signals near the end of the output:
- A line containing `Generated static files in "build"` (or similar success line).
- No error containing `URL` or `url` validation failures.

If `yarn build` fails for an unrelated reason (network, cache, lockfile drift), fix that first before attributing the failure to this change.

- [ ] **Step 5: Confirm the URL was baked into the build**

Run: `grep -l 'https://deviantcord.com' build/sitemap.xml build/index.html | wc -l`

Expected: `2` (both files contain the new URL). If 0 or 1, the build did not pick up the change — re-check that you saved the file before running `yarn build`.

- [ ] **Step 6: Commit (config change only — do NOT include the regenerated `build/` directory)**

```bash
git add docusaurus.config.js
git commit -m "Set docusaurus.config.js url to https://deviantcord.com

Replaces the placeholder 'https://your-docusaurus-test-site.com'
left over from the Docusaurus init. The url field is baked into
the build artifact (sitemap.xml, canonical link tags, og:url
metadata), so it must reflect the real public hostname before the
bare-metal deploy goes live.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Verify nothing else is staged:
```bash
git status
```
Expected: working tree clean (the regenerated `build/` directory is in `.gitignore` and not staged).

---

## Task 7: Final cross-implementation verification sweep

This task does no new authoring — it re-runs every check across the implemented set, confirms file modes, and looks for stragglers (test artifacts, debug prints, etc.) before the final review.

**Files:** none modified

- [ ] **Step 1: Re-verify all four authored files individually**

Run each in turn (each must succeed):

```bash
systemd-analyze verify deploy/app.service && echo "app.service: OK"
bash -n deploy/deploy.sh && echo "deploy.sh: OK"
python3 -c "import yaml; yaml.safe_load(open('.gitlab-ci.yml'))" && echo ".gitlab-ci.yml: OK"
python3 - <<'PY' && echo "README.md fences: OK"
import re
text = open('deploy/README.md').read()
q = len(re.findall(r'^````', text, re.M))
t = len(re.findall(r'^```(?!`)', text, re.M))
assert q % 2 == 0 and t % 2 == 0, f"unbalanced fences q={q} t={t}"
PY
```

Expected: four "OK" lines.

- [ ] **Step 2: Confirm file modes**

Run: `stat -c '%a %n' deploy/app.service deploy/deploy.sh deploy/README.md .gitlab-ci.yml`

Expected:
```
644 deploy/app.service
755 deploy/deploy.sh
644 deploy/README.md
644 .gitlab-ci.yml
```

If `deploy/deploy.sh` is not 755, `chmod 0755 deploy/deploy.sh && git add deploy/deploy.sh && git commit -m "chmod +x deploy/deploy.sh"`.

- [ ] **Step 3: Cross-check spec compliance for each file**

Open `specs/2026-05-03-bare-metal-deploy-design.md` alongside each of the four authored files and confirm:
- `deploy/app.service` matches §9.1 byte-for-byte (modulo whitespace).
- `deploy/deploy.sh` matches §9.2 byte-for-byte.
- `.gitlab-ci.yml` matches §9.3 byte-for-byte.
- `deploy/README.md` covers all eight items listed in §9.4.

Any discrepancy: either fix the file to match the spec, OR (if the file is right and the spec is stale) update the spec in a separate commit. Do NOT silently let them drift.

- [ ] **Step 4: Look for stragglers — test files, debug code, secrets**

Run:
```bash
git status
git ls-files --others --exclude-standard
grep -rn 'BEGIN OPENSSH\|BEGIN RSA\|BEGIN EC\|password\|TODO\|FIXME' deploy/ .gitlab-ci.yml docusaurus.config.js 2>/dev/null
```

Expected: working tree clean, no untracked files in this PR's scope, and the grep returns nothing relevant. (A `TODO` or `FIXME` left in is a code-quality smell; address before committing or document as a follow-up.)

- [ ] **Step 5: Confirm `.platform/` and `.platform.app.yaml` are still in-tree**

Run: `ls -la .platform .platform.app.yaml`

Expected: both exist. They are kept until the bare-metal deploy is verified working end-to-end (per spec §11 item 2). Their removal is a separate follow-up commit, not part of this work.

- [ ] **Step 6: Show the user the cumulative diff and the pre-push checklist**

Run: `git log --oneline origin/main..HEAD`

Expected: 6 commits (one per Task 1–6), in this order:
1. Add reference systemd unit for app.service
2. Add deploy/deploy.sh on-container orchestration
3. Add .gitlab-ci.yml build stage
4. Add .gitlab-ci.yml deploy stage
5. Add deploy/README.md operator notes
6. Set docusaurus.config.js url to https://deviantcord.com

(Plus the spec commit `894b4d8` and — once committed — the plan commit are the design baseline that gets pushed alongside, per the user's chosen cadence.)

Show the user:
```bash
git diff origin/main..HEAD --stat
```

And re-print the pre-push checklist from spec §12:

- [ ] Puppet has provisioned the container per spec §6 (user, paths, polkit rule, app.service installed and enabled, Node 18 present)
- [ ] Caddy on the host is configured to reverse-proxy `deviantcord.com` → `<container-ip>:8888` and has a valid certificate
- [ ] GitLab variables `DEPLOY_HOST`, `DEPLOY_SSH_PRIVATE_KEY` are set as Protected
- [ ] `main` is marked Protected in GitLab
- [ ] The runner with tag `deviantcord-site` is registered and has Node 18 + yarn available
- [ ] `~app/.ssh/authorized_keys` on the container contains the pubkey paired with `DEPLOY_SSH_PRIVATE_KEY`
- [ ] DNS for `deviantcord.com` is ready to cut over (or is already on the new host)

Wait for the user to confirm each checklist item is met before pushing. Per the workflow: implementation commits stay local until the user explicitly green-lights the push.

- [ ] **Step 7: Do NOT commit anything in this task**

This task is a verification sweep. If any defects were found and fixed inline (file mode, spec drift, etc.), commit those individually with descriptive messages — but the sweep itself produces no commit.

---

## Done criteria

- All seven tasks above completed in order.
- 6 commits on the branch (one per Task 1–6), plus any small fix commits from Task 7 if defects were caught.
- Final `git log --oneline origin/main..HEAD` matches the expected list in Task 7 Step 6.
- User has confirmed all items in the pre-push checklist.
- User has explicitly green-lit the push.
