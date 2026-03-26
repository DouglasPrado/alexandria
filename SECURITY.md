# Security Policy

## Supported Versions

| Version        | Supported |
| -------------- | --------- |
| latest (main)  | ✅        |
| older releases | ❌        |

## Reporting a Security Issue

**Please do NOT open public GitHub issues for security matters.**

Report privately via:

- **Email**: security@alexandria.app
- **GitHub Security Advisories**: https://github.com/douglas-prado/alexandria/security/advisories/new

### What to Include

- Description of the issue and its potential impact
- Steps to reproduce
- Affected versions
- Suggested fix (if any)
- Any relevant logs or config (remove credentials before sending)

## Response Timeline

| Step                    | Timeframe                          |
| ----------------------- | ---------------------------------- |
| Acknowledgment          | within 48 hours                    |
| Assessment              | within 7 days                      |
| Fix for critical issues | within 14 days                     |
| Fix for high severity   | within 30 days                     |
| Public disclosure       | 90 days after report (coordinated) |

## Disclosure Policy

We follow coordinated disclosure. Once a fix is available, we will:

1. Release a patched version
2. Publish a GitHub Security Advisory
3. Credit the reporter (unless they prefer anonymity)

## Automated Scanning

- **Dependabot** is enabled for dependency updates
- **CodeQL** runs on every push to `main`
- **npm audit** runs on every CI build

## Thank You

We appreciate responsible disclosure. Reporters will be credited in the security advisory and in the release notes.
