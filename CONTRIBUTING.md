# Contributing to WAR-RADAR

Thank you for your interest in contributing to WAR-RADAR! Every contribution helps make this project better.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/claudiovsky/warradar/issues) to avoid duplicates
2. Use the **Bug Report** issue template
3. Include steps to reproduce, expected vs actual behavior, and screenshots if applicable

### Suggesting Features

1. Open a [Feature Request](https://github.com/claudiovsky/warradar/issues/new?template=feature_request.md) issue
2. Describe the feature, motivation, and any implementation ideas

### Submitting Code

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the coding guidelines below
4. **Test locally** — ensure `npm run build` passes without errors
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add conflict filtering by date range"
   ```
6. **Push** and open a **Pull Request** against `main`

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Build process, dependencies |

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/warradar.git
cd warradar

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Fill in required API keys (see README)

# Start dev server
npm run dev
```

## Coding Guidelines

- **TypeScript** — All code must be properly typed. Avoid `any`.
- **Tailwind CSS** — Use utility classes. No inline styles unless necessary.
- **Components** — Keep them focused and reusable. One component per file.
- **API Routes** — Handle errors gracefully. Always return proper status codes.
- **No secrets** — Never commit API keys, credentials, or personal data.

## Code Review

All PRs are reviewed before merging. We look for:

- Clean, readable code
- Proper TypeScript types
- No breaking changes (or clear migration path)
- Build passes (`npm run build`)
- Lint passes (`npm run lint`)

## Areas Where Help is Wanted

- 🌍 **New data sources** — additional RSS feeds or conflict databases
- 🗺️ **Map improvements** — clustering, heatmaps, timeline slider
- ♿ **Accessibility** — ARIA labels, keyboard navigation, screen reader support
- 🧪 **Testing** — unit tests, integration tests, E2E tests
- 🌐 **Internationalization** — multi-language support
- 📱 **Mobile UX** — gesture interactions, offline support

## Questions?

Open a [Discussion](https://github.com/claudiovsky/warradar/discussions) or reach out via the collaboration form on [war-radar.com](https://war-radar.com).

---

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
