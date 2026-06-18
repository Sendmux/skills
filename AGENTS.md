# Sendmux Skills Agent Guide

Build only public Sendmux agent skills in this repository.

## Rules

- Teach only public Sendmux surfaces: API endpoints, SDK packages, the `sendmux` CLI, and Sendmux MCP servers.
- Do not expose Sendmux backend, hosting, datastore, service, vendor, or implementation details.
- Verify every endpoint, command, tool, package name, and key prefix from source before writing it into a skill.
- Keep `SKILL.md` bodies under 500 lines when possible. Move detail to one-level `references/` files.
- Use only canonical skill resource directories: `references/`, `scripts/`, and `assets/`.
- Draft evals before skill bodies. Validate, benchmark, optimise descriptions, and package each skill before marking it done.
- Use Australian spelling in public copy.
- Never put secrets in files or examples.

## Layout

```text
skills/
  <skill-name>/
    SKILL.md
    references/
    scripts/
    assets/
```

## Publish Boundary

Canonical GitHub repo: `Sendmux/skills`, with `main` as the default branch. Keep public examples on `npx skills add Sendmux/skills`.

Do not publish a new release, register/update skills.sh metadata, or publish docs without explicit approval.
