# N-GS Pay Math Lab

N-GS Pay Math Lab is a static, offline-capable General Schedule pay reconstruction and verification app for 1977 through 2026. It generates 50 annual schedules, 15 grades, 10 steps, and 7,500 grade-and-step cells from an auditable formula system.

Public site target: https://novakprotocol.github.io/N-GS-Pay-Math-Lab/

## What It Does

- Calculates annual base pay, locality pay, pay-cap effects, hourly pay, and biweekly pay.
- Lets users choose a 2026 OPM locality area or enter a manual locality percentage.
- Highlights the highest-paying 2026 OPM locality areas, Census T40 income-tax collection flags, and BEA RPP price-level gaps.
- Compares selected base pay growth against BLS CPI inflation to show buying-power drift.
- Adds a Historical Context Lab for average raises, pressure years, presidential administration and party, VA conflict eras, BLS CPI, and a Federal Reserve Z.1 market proxy.
- Shows formulas, substituted numbers, intermediate rounding, and final results.
- Adds offline canvas views for the grade/year pay surface, locality lift, and cap pressure.
- Distinguishes official tables, official checkpoints, formula reconstructions, reverse calculations, and user-entered scenarios.
- Provides a downloadable single-file offline build.
- Measures the formula package against generated static CSV, JSON, HTML, and optional PDF alternatives.

## Formula Authority

Static tables are useful outputs, but they are not the calculation authority. The authority here is the formula engine plus historical checkpoint data:

- Annual Step 1 update: `RHU(previous_step_1 * (1 + annual_base_raise_percent / 100))`
- Step calculation: `step_1 + (step - 1) * RHU(step_1 / 30)`
- Locality annual: `RHU(base * (1 + locality_percent / 100))`
- Pay cap: `min(locality_annual, cap)` when a cap is supplied
- Hourly divisor: `2,080` before 1984 and `2,087` from 1984 forward
- Hourly: `RHU2(annual / divisor)`
- Biweekly: `RHU2(hourly * 80)`

`RHU` means half-up whole-dollar rounding. `RHU2` means half-up cent rounding.

## Status Model

The app never describes a reconstructed value as an official published table.

- `Official table`: a complete official fixture table used for cell-by-cell validation.
- `Official checkpoint`: a published anchor used by the reconstruction chain.
- `Formula reconstruction`: a generated value between checkpoints.
- `Reverse calculation`: explicitly labeled derived treatment for low-grade historical rows.
- `User-entered scenario`: user-supplied locality or cap inputs.

## Run Locally

```text
python scripts/build.py
python scripts/validate.py
python scripts/build_size_receipt.py
python scripts/build_release_receipt.py
python -m unittest discover -s tests -p "test_*.py"
python scripts/serve.py
```

`scripts/serve.py` prints a local URL. The app itself has no server-side runtime, database, CDN, telemetry, cookies, login, spreadsheet dependency, or runtime API calls.

## Size Comparison

Run `python scripts/build_size_receipt.py` to regenerate:

- `evidence/size-comparison.json`
- `evidence/size-comparison.md`
- `site/evidence/size-comparison.json`

The receipt separates the calculation package without brand imagery from the complete deployed package with brand imagery. It also records original supplied N image bytes versus optimized deployed N assets, the original pay-lab HTML, the portal-reference HTML comparator, generated static alternatives, gzip sizes, ratios, storage reduction percentages, and bytes per represented pay cell.

## Portal Contract

`.itops/portal.json` declares a portable `static-module` contract:

- Module ID: `gs-pay-math-lab`
- Area: `technical-tools`
- Stable anchor: `module-gs-pay-math-lab`
- Standalone entrypoint: `site/index.html`
- Portal entrypoint: `site/module/index.html`

The public repository is marked `public`. A production private-only Portal should continue excluding this public record. `integration/portal-private-target-fixture.json` simulates the future private repository record for local classifier tests.

## Public N to Private VA-VISION

The private promotion path is profile-driven. A later private implementation may change only approved brand and target fields such as emblem asset, alt text, owner label, visibility, repository metadata, and approved internal navigation. Formula files, data files, rounding logic, validation fixtures, calculation UI behavior, size methodology, and accessibility behavior are protected by `scripts/verify_promotion_diff.py`.

`config/brand.va-vision.example.json` intentionally contains a placeholder emblem path. `scripts/promote_brand.py` refuses to validate that profile until the approved emblem file is supplied.

## Limitations

This project is an independent calculation and verification tool, not an official OPM service or payroll determination. It does not calculate special rates, law-enforcement schedules, title 38 schedules, agency payroll exceptions, tax liability, deductions, or individual employment records. Census T40 income-tax collection flags are informational only and do not account for residence, worksite, local taxes, sales taxes, property taxes, deductions, or capital-gains taxes. BEA RPP values are price-level comparisons, not OPM locality-pay or nonforeign-COLA determinations. Historical correlations are descriptive, not causal. Dow Jones index history is excluded under the federal-.gov-only source rule; the Historical Context Lab uses Federal Reserve Z.1 household corporate equities as a broad market proxy instead of a tradable stock index.

No license is granted by publication. See `NOTICE.md`.
