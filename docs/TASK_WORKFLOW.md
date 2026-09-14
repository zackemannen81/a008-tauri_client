# Task Workflow

Draft -> Ready -> In Progress -> Complete

Ready freezes goal, primary deliverable, scope, out-of-scope, definition of
done, and minimum verification gates. Claim the next identity in
`docs/TASK_IDS.md` on the default branch before Ready.

## Continuity Protocol

1. Start with `docs/CURRENT_TASK.md`; do not begin bounded work from chat context alone.
2. Read `PROJECT_BRIEF.md`, `CURRENT_STATUS.md`, `SYSTEMDOC.md`, `FILESTRUCTURE.md`, and the relevant journal entries.
3. Give each task the next `ATC-####` identity and record its owner and scope.
4. Keep `CURRENT_TASK.md` synchronized while active; move completed or paused task records to the corresponding directory.
5. Update `CURRENT_STATUS.md` when observed state, blockers, or verification results change.
6. Append decisions and milestones to `JOURNAL.md`; do not rewrite historical entries.
7. Update `SYSTEMDOC.md` only when implemented behavior or a stable contract changes.
8. Treat `C:\code\a008` as read-only reference material and record source-derived contracts before depending on them.
