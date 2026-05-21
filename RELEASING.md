# Releasing zyraa

Releases are published to npm automatically when you push a version tag. CI runs type check and build before publishing — if either fails, nothing is published.

## One-time setup

Add your npm token as a secret in the GitHub repo:

1. Go to [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) → **Generate New Token** → choose **Automation**
2. Copy the token
3. Go to the GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `NPM_TOKEN`
   - Value: the token you copied

## How to release

**1. Bump the version in `package.json`**

Follow [semver](https://semver.org):
- Bug fix → patch: `1.1.1` → `1.1.2`
- New feature → minor: `1.1.1` → `1.2.0`
- Breaking change → major: `1.1.1` → `2.0.0`

**2. Commit and tag**

```bash
git add package.json
git commit -m "fix: bump to x.x.x"
git tag vx.x.x
git push
git push origin vx.x.x
```

**3. Watch the workflow**

Go to the GitHub repo → **Actions** tab → the `Publish` workflow will run. If it passes, the new version is live on npm within a minute.

**4. Verify**

```bash
npm view zyraa version
```

## What the workflow does

1. Installs dependencies
2. Runs `tsc --noEmit` — blocks publish if there are type errors
3. Runs `pnpm build` — compiles TypeScript via tsup
4. Runs `npm publish` using the `NPM_TOKEN` secret

## If the publish fails

- Type error → fix the error, bump the patch version, retag
- npm auth error → check that `NPM_TOKEN` secret is set and not expired
- Version already exists → npm does not allow republishing the same version; bump the version and retag
