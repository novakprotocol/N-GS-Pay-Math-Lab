# Generic Static Module Adapter Design

The adapter should be generic and manifest-driven. It must not special-case GS Pay Math Lab by repository name or hard-coded card content.

Required behavior:

- Read `.itops/portal.json` from a private repository record already accepted by the private-only classifier.
- Read the release receipt declared by the contract.
- Copy allowlisted static files into `modules/technical-tools/gs-pay-math-lab/`.
- Reject absolute paths, `..`, symlinks that escape the artifact, executable files, and unexpected extensions.
- Allow only `.html`, `.css`, `.js`, `.json`, `.png`, `.webp`, `.svg`, `.ico`, and `.txt`.
- Verify SHA-256 and byte counts before publishing the copied module.
- Enforce a configurable maximum artifact size.
- Never pass a repository token to browser code.
- Never perform a repository build in an employee browser.
- Never embed a public Pages URL in an iframe inside the private Portal.

Expected generated card:

- Area: `technical-tools`
- Anchor: `module-gs-pay-math-lab`
- Title: `GS Pay Math Lab`
- Source: manifest metadata, not repository-name guessing.
