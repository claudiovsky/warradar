# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in WAR-RADAR, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use one of these methods:

1. **GitHub Security Advisories** — [Report a vulnerability](https://github.com/claudiovsky/warradar/security/advisories/new) (preferred)
2. **Email** — Contact the maintainer through the collaboration form at [war-radar.com](https://war-radar.com)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment** — Within 48 hours
- **Assessment** — Within 7 days
- **Fix** — Dependent on severity, typically within 14 days for critical issues

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `main` | ✅ |
| Older commits | ❌ |

## Security Best Practices for Contributors

- Never commit API keys, tokens, or credentials
- Use environment variables for all sensitive configuration
- Keep dependencies updated (`npm audit`)
- Validate and sanitize all user input in API routes
- Admin endpoints must use `verifyAdmin` authentication

## Scope

The following are in scope:

- Authentication/authorization bypasses
- Data exposure through API endpoints
- XSS, CSRF, or injection vulnerabilities
- Sensitive data in source code or git history

The following are out of scope:

- Issues in third-party dependencies (report upstream)
- Social engineering attacks
- Denial of service (unless trivially exploitable)
- Issues requiring physical access
