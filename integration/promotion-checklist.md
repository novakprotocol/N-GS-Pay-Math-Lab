# Public N to Private VA-VISION Promotion Checklist

1. User supplies the approved VA-VISION emblem file.
2. Create the private target repository in the approved enterprise namespace.
3. Import the tested public release source without changing formula or data files.
4. Activate `config/brand.va-vision.example.json` after replacing the placeholder emblem path.
5. Activate `config/target.ghe-private.example.json` after replacing placeholders with approved private metadata.
6. Set required private repository custom properties and reviewed lifecycle.
7. Run `python scripts/build.py`, `python scripts/validate.py`, `python scripts/build_size_receipt.py`, and the unit tests.
8. Run `python scripts/verify_promotion_diff.py` against the public release base and private promotion branch.
9. Confirm `.itops/portal.json` is discovered under Technical Tools with stable anchor `module-gs-pay-math-lab`.
10. Verify private Pages and Portal access.
11. Confirm no public Pages URL is embedded inside the private Portal.

Allowed promotion differences:

- Emblem asset
- Emblem alt text
- Product or owner label
- Public versus internal disclaimer
- Repository and Pages URLs
- Visibility and portal enrollment metadata
- Approved internal navigation link

Blocked promotion differences:

- Formula functions
- Historical checkpoint data
- Rounding logic
- Validation fixtures
- Calculation UI behavior
- Size-comparison methodology
- Accessibility behavior
