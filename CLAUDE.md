# Claude Code Project Configuration

## Coding Practices

### Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, whitespace, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or modifying tests
- `chore`: Changes to build process, tooling, dependencies, etc.
- `ci`: Changes to CI/CD configuration
- `build`: Changes affecting build system or dependencies
- `revert`: Reverts a previous commit

**Breaking Changes:**
- Add `!` after type/scope: `feat!: breaking change`
- Or include `BREAKING CHANGE:` in footer

**Examples:**
```
feat: add meal planning API endpoint
fix: correct calorie calculation in recipe
docs: update README with installation steps
chore: upgrade dependencies to latest versions
feat(auth)!: migrate to OAuth2 authentication
```

### Semantic Versioning

All releases must follow [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes (breaking changes)
- **MINOR**: Backwards-compatible new functionality
- **PATCH**: Backwards-compatible bug fixes

**Tag Format:** `vMAJOR.MINOR.PATCH`

**Examples:**
- `v1.0.0` - Initial release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking change

**Pre-release versions:**
- `v1.0.0-alpha.1`
- `v1.0.0-beta.1`
- `v1.0.0-rc.1`

**Determining Version Bumps:**
- Commits with `feat!`, `fix!`, or `BREAKING CHANGE:` → MAJOR bump
- Commits with `feat:` → MINOR bump
- Commits with `fix:`, `perf:` → PATCH bump
- Other commit types typically don't trigger releases

## Git Workflow

- Always create descriptive commit messages following conventional commits
- Tag releases using semantic versioning
- Keep commits atomic and focused on a single change
- Never force-push to main/master unless explicitly authorized
