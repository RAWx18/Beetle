# Contributing to Beetle

## Overview

Beetle revolutionizes Git-based collaboration through Branch-Level Intelligence, providing contextual AI assistance and intelligent workflow orchestration. This guide outlines the contribution process for both backend and frontend development.

## Prerequisites

- Git installed and configured
- Node.js (v18+) and npm/yarn
- GitHub account with SSH keys
- Basic understanding of Git workflows

## Project Structure

```
beetle/
├── beetle_backend/     # Backend API and AI services
├── beetle_frontend/    # Frontend application
├── CONTRIBUTING.md     # This file
├── LICENSE.md         # License information
└── README.md          # Project documentation
```

## Branch Strategy

- **main**: Production-ready code, stable releases
- **dev**: Development branch for integration and testing

All contributions must target the `dev` branch.

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/beetle.git
cd beetle
git remote add upstream https://github.com/RAWx18/beetle.git
```

### 2. Setup Development Environment

```bash
# Backend setup
cd beetle_backend

# Frontend setup
cd ../beetle_frontend
npm install
npm run dev
```

### 3. Sync with Upstream

```bash
git fetch upstream
git checkout dev
git merge upstream/dev
git push origin dev
```

## Contribution Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming convention:
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

### 2. Development Guidelines

#### Code Quality
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Maintain TypeScript strict mode
- Document public APIs

### 3. Commit Changes

Use semantic commit messages:

```bash
git commit -m "type(scope): description

- Specific change details
- Reference issues (#123)
- Note breaking changes"
```

Examples:
- `feat(ai-engine): implement contextual suggestions`
- `fix(branch-parser): resolve merge conflict detection`
- `docs(api): update authentication endpoints`

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Create PR targeting `RAWx18/beetle:dev`

## Pull Request Requirements

### Title Format
```
type(scope): Brief description
```

### Required Information
- Clear description of changes
- Testing completed checklist
- Related issue references
- Breaking changes (if any)
- Documentation updates

### Review Process
1. Automated CI/CD checks must pass
2. Code review by maintainer required
3. All tests must pass
4. Documentation updated for user-facing changes

## Code Standards

### Backend (beetle_backend)
- API documentation

### Frontend (beetle_frontend)
- Component-based architecture
- Responsive design
- Accessibility compliance
- Performance optimization

## Quality Checklist

Before submitting:
- Code follows project style guidelines
- All tests pass locally
- Documentation updated
- No performance regressions
- Security considerations addressed

## Issue Reporting

When reporting bugs:
- Use clear, descriptive titles
- Include steps to reproduce
- Provide system information
- Include relevant logs or screenshots

## Questions and Support

- GitHub Issues for bug reports and feature requests
- GitHub Discussions for general questions
- Check existing documentation before asking

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.