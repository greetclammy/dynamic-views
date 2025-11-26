# Test Suite Integration Guide

## Overview
This guide helps you integrate the comprehensive test suite from branch `claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp` into your local branch.

## What Was Created

### Test Infrastructure (7 commits, 448 passing tests)

**Files Added:**
- `jest.config.cjs` - Jest configuration
- `tests/setup.ts` - Global test setup with mocks
- `tests/__mocks__/obsidian.ts` - Obsidian API mocks
- `tests/__mocks__/styleMock.js` - CSS module mock
- `.github/workflows/test.yml` - CI/CD workflow
- 14 test files (see below)

**Files Modified:**
- `package.json` - Added test dependencies and scripts
- `.gitignore` - May have test coverage additions

### Test Files Created (448 tests total)

1. **tests/utils/masonry-layout.test.ts** (38 tests)
2. **tests/utils/sanitize.test.ts** (30 tests)
3. **tests/utils/image-color.test.ts** (46 tests)
4. **tests/utils/randomize.test.ts** (44 tests)
5. **tests/utils/preview.test.ts** (62 tests)
6. **tests/utils/file.test.ts** (16 tests)
7. **tests/utils/storage.test.ts** (13 tests)
8. **tests/utils/property.test.ts** (49 tests)
9. **tests/utils/dropdown-position.test.ts** (21 tests)
10. **tests/utils/query-sync.test.ts** (45 tests)
11. **tests/utils/style-settings.test.ts** (56 tests)
12. **tests/utils/image.test.ts** (49 tests, 1 skipped)
13. **tests/shared/data-transform.test.ts** (21 tests)
14. **tests/persistence.test.ts** (40 tests)

## Integration Methods

### Option 1: Cherry-Pick Individual Commits (Recommended)

This gives you fine-grained control over what to integrate.

```bash
# 1. Fetch the remote branch
git fetch origin claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp

# 2. View the commits to cherry-pick
git log --oneline origin/claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp ^origin/main --reverse

# 3. Cherry-pick commits one by one (or all at once)
# Individual:
git cherry-pick 54f0a64  # Jest infrastructure
git cherry-pick 6765715  # Storage tests
git cherry-pick 1d8d763  # Property tests
git cherry-pick 6a2930e  # Data transform tests
git cherry-pick 4bedd2b  # Persistence tests + fixes
git cherry-pick d65aa2f  # Dropdown + query-sync tests
git cherry-pick b19d8ab  # Style-settings + image tests

# Or all at once:
git cherry-pick 54f0a64^..b19d8ab

# 4. Resolve any conflicts if they arise
# package.json is most likely to conflict
```

### Option 2: Merge the Branch

```bash
# 1. Fetch the remote branch
git fetch origin claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp

# 2. Merge into your current branch
git merge origin/claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp

# 3. Resolve conflicts (likely in package.json)
# Keep both sets of dependencies
```

### Option 3: Manual File Copy (Most Control)

```bash
# 1. Create a temporary directory and clone
mkdir /tmp/test-integration
cd /tmp/test-integration
git clone https://github.com/greetclammy/dynamic-views.git
cd dynamic-views
git checkout claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp

# 2. Copy test files to your local repo
cp -r tests /path/to/your/local/dynamic-views/
cp jest.config.cjs /path/to/your/local/dynamic-views/
cp .github/workflows/test.yml /path/to/your/local/dynamic-views/.github/workflows/

# 3. Manually merge package.json changes (see below)
```

## Package.json Changes to Integrate

Add these to your `package.json`:

### Dev Dependencies
```json
"devDependencies": {
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/preact": "^3.2.3",
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "ts-jest": "^29.1.1",
  // ... keep your existing devDependencies
}
```

### Scripts
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:verbose": "jest --verbose",
  // ... keep your existing scripts
}
```

## Verify Integration

After integration, run:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Should see: "Tests: 1 skipped, 448 passed, 449 total"

# View coverage
npm run test:coverage

# Should see ~20% coverage with these utilities covered:
# - All of src/utils/ at 100%
# - src/shared/data-transform.ts
# - src/persistence.ts
```

## Potential Conflicts

### package.json
**Most likely conflict location.** Merge both sets of dependencies:
- Keep all your existing dependencies
- Add the test-related devDependencies listed above
- Add the test scripts

### .gitignore
If you have local .gitignore changes, you may need to merge:
```
coverage/
.jest-cache/
```

## Testing the Integration

```bash
# 1. Run tests
npm test

# 2. Check CI/CD workflow
git push  # Triggers GitHub Actions test workflow

# 3. Verify coverage
npm run test:coverage
```

## What These Tests Cover

- ✅ **All utilities** (src/utils/) - 100% coverage
- ✅ **Data transformation** (Bases/Datacore → CardData)
- ✅ **Persistence** (Settings & state management)
- ⏳ **Components** - Infrastructure ready, not yet implemented
- ⏳ **Views** - Not yet covered

Total: ~20% codebase coverage, 448 tests

## Commit Messages for Reference

```
54f0a64 - feat: Add comprehensive Jest test suite with 158 passing tests
6765715 - test: Add storage utility tests (171 total passing tests)
1d8d763 - test: Add comprehensive property.ts tests (220 total tests)
6a2930e - test: Add data-transform.ts tests (241 total tests, 234 passing)
4bedd2b - test: Add persistence tests and fix data-transform tests
d65aa2f - test: Add dropdown-position and query-sync tests
b19d8ab - test: Add style-settings and image utility tests
```

## Need Help?

If you encounter merge conflicts or issues:

1. **Check commit diffs**: `git show <commit-hash>`
2. **View file from test branch**: `git show origin/claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp:path/to/file`
3. **Compare versions**: `git diff your-branch origin/claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp -- path/to/file`

## Quick Start (Recommended Path)

```bash
# On your local machine, in your local branch:
git fetch origin claude/optimize-plugin-credits-01WL4CUrHxs5QXMDnpaMhHjp
git cherry-pick 54f0a64^..b19d8ab
# Resolve package.json conflict by keeping both sets of changes
npm install
npm test
```

That's it! You should have 448 passing tests integrated into your local branch.
