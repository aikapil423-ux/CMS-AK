# Complaints integrity and sessions

Complaints reads and writes require an HTTP-only signed session cookie. The API resolves the officer role and jurisdiction from the server roster; client query parameters cannot grant access. URL auto-login and unknown-PNO fallback have been removed. Local development still supports exact roster PNO + demo PIN 123456, and authenticated persona switching. Production disables both demo PIN access and persona switching.

Production must configure CMS_SESSION_SECRET (a persistent random secret of at least 32 bytes) and CMS_LOGIN_CREDENTIALS. CMS_LOGIN_CREDENTIALS is a JSON object keyed by exact roster PNO, with a separate `salt:hash` value per officer. Hashes are 64-byte Node crypto scrypt results encoded as 128 hexadecimal characters. Keep these values in the deployment secret store; do not commit them. Existing deployments need a fresh sign-in after this change. The current app still uses its configured officer roster; this does not introduce an identity provider or account provisioning.

The complaints-store.json file is authoritative. Missing files yield an empty register; empty arrays remain empty; malformed data is reported instead of silently replaced with demo records. The API rejects legacy bulk replacement. Each mutation submits only changed records and their expected persistenceVersion. A cross-process file lock and atomic temporary-file rename prevent concurrent overwrites and partial JSON writes. Version conflicts return 409 and require a refresh before retrying. Existing records start at version zero and receive their first version on the next successful save.

Browser cache exhaustion never trims records. Confirmed backend saves remain available after reload; the UI displays a cache warning. Main complaint mutations await backend confirmation and restore the previous in-memory state on failure. General diary and other module side effects retain their existing workflows and are not a distributed transaction with the complaints file.

Complaint numbers use station, year and actual district. Server validation catches stale numbering at registration. resolvedAt freezes completed complaint age; legacy records use their recorded FIR/disposal/SHO approval timestamp, falling back to their current updatedAt once if no historical completion timestamp exists. A genuine reopening clears resolvedAt. FIR registration-pending queues remain active.

Checks: `node --test tests/complaints-integrity.test.cjs`, existing FIR/bail/report regression tests, and `npx tsc --noEmit --incremental false`.

Browser verification: signed local sign-in, station-wide SHO register, assigned-only EO register (including legacy PNO formatting), and denied direct access to another EO complaint. The original SHO persona was restored after verification. Existing case records were not edited during browser checks.
