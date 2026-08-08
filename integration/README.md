# Portal Integration

This public repository carries a portable `.itops/portal.json` contract for the GS Pay Math Lab module. The public record is intentionally marked `public`; a production private-only Portal must continue excluding it.

The future private promotion should use the same calculation files, data files, tests, and site structure. Only approved brand and target profile fields may change.

Included artifacts:

- `portal-private-target-fixture.json`: simulated private repository metadata for local Portal classifier tests.
- `portal-registration.expected.json`: expected module registration after private promotion.
- `portal-module-release.schema.json`: static module release contract used by the adapter design.
- `portal-patch/static-module-adapter.patch.md`: generic adapter design notes when the central Portal needs static module copy support.
- `promotion-checklist.md`: human promotion sequence.
- `promotion-template.json`: machine-readable promotion template and diff whitelist.
