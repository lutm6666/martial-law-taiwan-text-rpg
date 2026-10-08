# AI dispatch lifecycle and recovery contract (PR #42)

## Invariants

1. An Issue is the routing source; labels are mutable hints, never authorization. Verify repository writer permission for every implementation attempt.
2. A work PR is identified by its repository, base, managed marker, Issue number and owned `ai/issue-N[-rRUN]` head. A branch name alone does not establish ownership.
3. The plan digest must match the current Issue title/body before a model run. A missing or malformed plan cannot authorize execution.
4. **Never run a model on a dirty implementation branch.** A dirty branch has any non-plan changed file in the PR; a failed publication may have committed untrusted code already.
5. Never reset, delete, force-push or silently reuse a dirty branch. Close its PR only after selecting and validating a fresh, unoccupied branch; retain the old ref for audit.
6. A GitHub Actions rerun preserves `runId` and increments `runAttempt`. The branch allocator must use an attempt-qualified candidate for a replacement after partial publication; do not reuse a closed PR's head.
7. An already published ready PR with the matching plan digest is idempotent for the same reopened run. An unfinished draft PR with only a plan is resumable.
8. An absent pre-plan ref is creatable; an existing ref without a PR or plan is recoverable only when it still points exactly to current `main` and has no associated PR. Otherwise fail closed.
9. The retry label can be consumed on the first attempt. Subsequent attempts may resume only if the actor is a writer, `runAttempt > 1`, and the matching plan and run provenance can be established.
10. The dispatcher must emit `run=false` on benign no-ops and never infer successful publication from a successful dispatch.

## Transition matrix

| Event / current state | Expected transition | Model run |
| --- | --- | --- |
| opened / no branch | create plan-only draft on fresh ref | writer + route only |
| opened rerun / same plan-only draft | reuse draft, do not create another PR | yes, if authorized |
| opened rerun / draft contains implementation | allocate new clean ref, retire dirty PR | yes, only on clean ref |
| edited / plan-only draft | update digest and plan, reconcile routing | no |
| edited / ready PR | convert to draft before modifying plan | no |
| retry / plan-only draft | reuse plan-only draft, consume label | yes |
| retry rerun / plan-only draft | verify run and digest, reuse | yes |
| retry / dirty draft or ready implementation | allocate clean attempt-specific ref; retire old PR | yes |
| reopened / old closed PR | allocate clean attempt-specific ref | yes |
| reopened rerun / matching ready PR | preserve published PR unchanged | no |
| reopened rerun / plan-only draft | resume existing draft | yes |
| reopened rerun / dirty draft | allocate a new attempt-specific ref | yes |
| closed / open managed PR | invalidate managed PR | no |
| branch exists without plan or PR, ref == main | recover by writing plan | according to event |
| branch exists without plan or PR, ref != main | fail closed; no destructive cleanup | no |

## Required fault-injection regressions

- Failure before plan write, before PR creation, after implementation ref update, during final sync, and during ready-for-review mutation.
- Retry with and without consumed label; rerun with same `runId` and incremented `runAttempt`.
- Reopened retry collision against an existing closed retry branch.
- Plan-only versus dirty draft, and published ready PR idempotency.
- Malicious Issue title containing managed markers; unauthorized actors; changed Issue digest; foreign branch collisions.

## Implementation order

1. Extract branch allocation / ownership and clean-draft classification into pure, testable helpers.
2. Make rerun recovery select a new attempt-qualified ref *before* closing a dirty PR; reject any occupied or unowned candidate.
3. Centralize the transition decision; keep GitHub mutations in an explicit execution phase.
4. Run all dispatch, publish, workflow-contract, and project validation tests, then obtain fresh Codex review.

This document defines the target contract, not a claim that every transition is already implemented.
