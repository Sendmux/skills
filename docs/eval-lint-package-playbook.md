# Eval, Lint, Package Playbook

Use this loop for every Sendmux skill. Run commands from the local `skill-creator` toolkit checkout unless a command says otherwise.

## Inputs

- Skill path: `skills/<skill-name>`
- Eval prompts: `skills/<skill-name>/evals/evals.json`
- Trigger evals: `skills/<skill-name>/evals/trigger-evals.json`
- Workspace: `<skill-name>-workspace/iteration-N`

## Per-Skill Loop

1. Draft evals first:
   ```bash
   $EDITOR skills/<skill-name>/evals/evals.json
   ```
2. Validate frontmatter and structure:
   ```bash
   python3 -m scripts.quick_validate /path/to/sendmux-skills/skills/<skill-name>
   ```
3. Run with-skill and baseline tasks into:
   ```text
   <skill-name>-workspace/iteration-N/eval-*/with_skill/run-*/outputs/
   <skill-name>-workspace/iteration-N/eval-*/without_skill/run-*/outputs/
   ```
4. Grade each run into `grading.json`, using fields `text`, `passed`, and `evidence`.
5. Aggregate the benchmark:
   ```bash
   python3 -m scripts.aggregate_benchmark \
     /path/to/sendmux-skills/<skill-name>-workspace/iteration-N \
     --skill-name <skill-name> \
     --skill-path /path/to/sendmux-skills/skills/<skill-name>
   ```
6. Generate the static review viewer:
   ```bash
   python3 eval-viewer/generate_review.py \
     /path/to/sendmux-skills/<skill-name>-workspace/iteration-N \
     --skill-name <skill-name> \
     --benchmark /path/to/sendmux-skills/<skill-name>-workspace/iteration-N/benchmark.json \
     --static /path/to/sendmux-skills/<skill-name>-workspace/iteration-N/review.html
   ```
7. Run description optimisation after the body is stable:
   ```bash
   PYTHONPATH=/path/to/skill-creator \
   python3 -m scripts.run_loop \
     --eval-set /path/to/sendmux-skills/skills/<skill-name>/evals/trigger-evals.json \
     --skill-path /path/to/sendmux-skills/skills/<skill-name> \
     --model sonnet \
     --max-iterations 5 \
     --verbose
   ```
8. Package the skill:
   ```bash
   python3 -m scripts.package_skill \
     /path/to/sendmux-skills/skills/<skill-name> \
     /path/to/sendmux-skills/dist
   ```
9. Install smoke:
   ```bash
   unzip -q dist/<skill-name>.skill -d .tmp/install-targets/claude/skills
   unzip -q dist/<skill-name>.skill -d .tmp/install-targets/agents/skills
   python3 -m scripts.quick_validate .tmp/install-targets/claude/skills/<skill-name>
   python3 -m scripts.quick_validate .tmp/install-targets/agents/skills/<skill-name>
   ```

## Notes

- Run `generate_review.py --static` only after each run directory has an `outputs/` folder.
- For one-query smoke tests with `--holdout 0`, use `run_loop --report none`; the HTML report path expects held-out test results.
- Keep eval workspaces and install targets under ignored paths unless a future item explicitly asks to publish them.
