# Mobile Incident Runbook (Phase 14)

## Severity
- `P0`: app unusable, auth outage, or data integrity risk.
- `P1`: major feature blocked with no workaround.
- `P2`: degraded behavior with workaround available.

## Detection Signals
- Crash spikes from app observability events.
- API error spikes (`api.error`) with repeated status/code patterns.
- Smoke suite regression after release.

## Immediate Response
1. Confirm incident severity and affected platforms (iOS, Android, both).
2. Capture evidence:
   - endpoint/method
   - status/code/message
   - traceId
   - payload shape
3. Freeze rollout and pause staged percentage increase.
4. Assign owner and incident commander.

## Triage Flow
1. Reproduce issue using the same app build and API environment.
2. Validate whether failure is:
   - mobile logic regression,
   - backend contract/runtime issue,
   - environment/signing/distribution issue.
3. If backend issue:
   - open blocker with full trace data.
   - keep fallback behavior only inside API layer.

## Mitigation Options
- Hotfix mobile patch (preferred when client-side regression).
- Backend rollback/fix (preferred when server-side regression).
- Feature disablement by permission/access configuration if available.

## Recovery and Closure
1. Verify fix with smoke + contract suites.
2. Confirm incident metrics are back to baseline.
3. Resume rollout in staged steps.
4. Publish postmortem with root cause and preventive actions.
