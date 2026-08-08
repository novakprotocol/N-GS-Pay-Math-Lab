from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

from receipt_utils import ROOT, read_json


FORMULA_VERSION = "n-gs-pay-math-lab-v0.01"


@dataclass(frozen=True)
class PayData:
    adjustments: dict[str, Any]
    checkpoints: dict[str, Any]
    validation: dict[str, Any]
    locality: dict[str, Any]
    locality_rates: dict[str, Any]
    sources: dict[str, Any]


def load_pay_data(root: Path = ROOT) -> PayData:
    return PayData(
        adjustments=read_json(root / "data" / "annual-adjustments.json"),
        checkpoints=read_json(root / "data" / "historical-checkpoints.json"),
        validation=read_json(root / "data" / "official-validation.json"),
        locality=read_json(root / "data" / "locality-examples.json"),
        locality_rates=read_json(root / "data" / "locality-rates.json"),
        sources=read_json(root / "data" / "sources.json"),
    )


DATA = load_pay_data()


def years(data: PayData = DATA) -> list[int]:
    coverage = data.adjustments["coverage"]
    return list(range(coverage["first_year"], coverage["last_year"] + 1))


def base_raise(year: int, data: PayData = DATA) -> float:
    return float(data.adjustments["base_raise_percent"][str(year)])


def round_half_up(value: float | int | Decimal, decimals: int = 0) -> float | int:
    quant = Decimal("1") if decimals == 0 else Decimal("1").scaleb(-decimals)
    rounded = Decimal(str(value)).quantize(quant, rounding=ROUND_HALF_UP)
    return int(rounded) if decimals == 0 else float(rounded)


def factor(rate: float) -> Decimal:
    return Decimal("1") + (Decimal(str(rate)) / Decimal("100"))


def segment_for_year(year: int) -> dict[str, Any]:
    if year <= 1979:
        return {"anchor": year, "direction": "exact"}
    if year <= 1990:
        return {"anchor": 1979, "direction": "forward"}
    if year <= 1996:
        return {"anchor": 1991, "direction": "exact" if year == 1991 else "forward"}
    if year <= 2013:
        return {"anchor": 1997, "direction": "exact" if year == 1997 else "forward"}
    if year <= 2022:
        return {"anchor": 2014, "direction": "exact" if year == 2014 else "forward"}
    return {"anchor": year, "direction": "exact"}


def apply_annual(value: int, year: int, data: PayData = DATA) -> int:
    return int(round_half_up(Decimal(value) * factor(base_raise(year, data))))


def reverse_annual(value: int, year: int, data: PayData = DATA) -> int:
    return int(round_half_up(Decimal(value) / factor(base_raise(year, data))))


def anchor_for(year: int, data: PayData = DATA) -> dict[str, Any]:
    return data.checkpoints["anchors"][str(year)]


def derive_from_anchor(year: int, grade: int, step: int, data: PayData = DATA) -> dict[str, Any]:
    if year not in years(data):
        raise ValueError(f"year outside coverage: {year}")
    if not 1 <= grade <= 15:
        raise ValueError(f"grade outside GS range: {grade}")
    if not 1 <= step <= 10:
        raise ValueError(f"step outside range: {step}")

    segment = segment_for_year(year)
    anchor = anchor_for(segment["anchor"], data)
    low_grade = grade <= 2
    chain: list[dict[str, Any]] = []
    step1: int | None = None
    cell: int | None = None

    if low_grade:
        cell = int(anchor["low"][str(grade)][step - 1])
        chain.append({"year": segment["anchor"], "before": None, "rate": None, "after": cell, "exact": True, "kind": "cell"})
    else:
        step1 = int(anchor["step1"][grade])
        chain.append({"year": segment["anchor"], "before": None, "rate": None, "after": step1, "exact": True, "kind": "step1"})

    if segment["direction"] == "forward":
        for y in range(segment["anchor"] + 1, year + 1):
            if low_grade:
                before = int(cell)
                cell = apply_annual(before, y, data)
                chain.append({"year": y, "before": before, "rate": base_raise(y, data), "after": cell, "kind": "cell"})
            else:
                before = int(step1)
                step1 = apply_annual(before, y, data)
                chain.append({"year": y, "before": before, "rate": base_raise(y, data), "after": step1, "kind": "step1"})
    elif segment["direction"] == "backward":
        for y in range(segment["anchor"], year, -1):
            if low_grade:
                before = int(cell)
                cell = reverse_annual(before, y, data)
                chain.append({"year": y - 1, "before": before, "rate": base_raise(y, data), "after": cell, "reverse": True, "kind": "cell"})
            else:
                before = int(step1)
                step1 = reverse_annual(before, y, data)
                chain.append({"year": y - 1, "before": before, "rate": base_raise(y, data), "after": step1, "reverse": True, "kind": "step1"})

    if low_grade:
        base = int(cell)
        wgi = None
    else:
        wgi = int(round_half_up(Decimal(step1) / Decimal("30")))
        base = int(step1) + (step - 1) * wgi

    exact_anchor = segment["direction"] == "exact"
    low_modeled = bool(anchor.get("low_modeled")) and low_grade
    status = "Formula reconstruction"
    status_class = "recon"
    if exact_anchor and not low_modeled:
        status = anchor.get("status", "Official checkpoint")
        status_class = "exact"
    elif low_modeled:
        status = anchor.get("low_status", "Formula reconstruction")
        status_class = "model"

    return {
        "year": year,
        "grade": grade,
        "step": step,
        "base": base,
        "step1": step1,
        "wgi": wgi,
        "chain": chain,
        "anchorYear": segment["anchor"],
        "anchorLabel": anchor["label"],
        "scheduleBadge": anchor.get("schedule_badge", "Formula reconstruction year"),
        "direction": segment["direction"],
        "lowGrade": low_grade,
        "lowModeled": low_modeled,
        "status": status,
        "statusClass": status_class,
        "adjustment": base_raise(year, data),
    }


def build_schedule(year: int, data: PayData = DATA) -> list[list[int]]:
    return [[derive_from_anchor(year, grade, step, data)["base"] for step in range(1, 11)] for grade in range(1, 16)]


def hourly_divisor(year: int) -> int:
    return 2080 if year < 1984 else 2087


def compute_pay(
    year: int,
    grade: int,
    step: int,
    locality_percent: float = 0.0,
    cap: float | None = None,
    apply_cap: bool = False,
    data: PayData = DATA,
) -> dict[str, Any]:
    base_detail = derive_from_anchor(year, grade, step, data)
    locality_raw = Decimal(base_detail["base"]) * (Decimal("1") + Decimal(str(locality_percent)) / Decimal("100"))
    locality_rounded = int(round_half_up(locality_raw))
    cap_is_valid = apply_cap and cap is not None and cap > 0
    annual = min(locality_rounded, cap) if cap_is_valid else locality_rounded
    capped = bool(cap_is_valid and locality_rounded > cap)
    divisor = hourly_divisor(year)
    hourly = round_half_up(Decimal(str(annual)) / Decimal(divisor), 2)
    biweekly = round_half_up(Decimal(str(hourly)) * Decimal("80"), 2)
    return {
        **base_detail,
        "localityPct": locality_percent,
        "localityRaw": float(locality_raw),
        "localityRounded": locality_rounded,
        "cap": cap,
        "capIsValid": bool(cap_is_valid),
        "capped": capped,
        "annual": float(annual),
        "divisor": divisor,
        "hourly": hourly,
        "biweekly": biweekly,
        "formulaVersion": FORMULA_VERSION,
    }


def schedule_cell_count(data: PayData = DATA) -> int:
    return sum(len(row) for year in years(data) for row in build_schedule(year, data))


def official_2026_match_count(data: PayData = DATA) -> int:
    generated = build_schedule(2026, data)
    official = data.validation["official_2026"]
    return sum(1 for g in range(15) for s in range(10) if generated[g][s] == official[g][s])


def wrong_shortcut_mismatch_count(data: PayData = DATA) -> int:
    official_2025 = data.validation["official_2025"]
    official_2026 = data.validation["official_2026"]
    mismatch = 0
    for g in range(15):
        for s in range(10):
            shortcut = round_half_up(Decimal(official_2025[g][s]) * Decimal("1.01"))
            if shortcut != official_2026[g][s]:
                mismatch += 1
    return mismatch


def calculation_record(
    year: int,
    grade: int,
    step: int,
    locality_percent: float = 0.0,
    cap: float | None = None,
    apply_cap: bool = False,
    data: PayData = DATA,
) -> dict[str, Any]:
    result = compute_pay(year, grade, step, locality_percent, cap, apply_cap, data)
    validation_status = "not-an-official-fixture"
    if year == 2026 and result["base"] == data.validation["official_2026"][grade - 1][step - 1]:
        validation_status = "matches-2026-official-fixture"
    return {
        "inputs": {
            "year": year,
            "grade": grade,
            "step": step,
            "locality_percent": locality_percent,
            "cap": cap,
            "apply_cap": apply_cap,
        },
        "formula_version": FORMULA_VERSION,
        "rounding_mode": "half-up",
        "classification": result["status"],
        "validation_status": validation_status,
        "intermediate_values": {
            "anchor_year": result["anchorYear"],
            "anchor_label": result["anchorLabel"],
            "chain": result["chain"],
            "step1": result["step1"],
            "base": result["base"],
            "locality_raw": result["localityRaw"],
            "locality_rounded": result["localityRounded"],
            "annual": result["annual"],
            "divisor": result["divisor"],
            "hourly": result["hourly"],
            "biweekly": result["biweekly"],
        },
        "result": {
            "annual_base_pay": result["base"],
            "annual_with_locality_and_cap": result["annual"],
            "hourly": result["hourly"],
            "biweekly": result["biweekly"],
        },
    }


def validation_receipt(data: PayData = DATA) -> dict[str, Any]:
    schedules = {year: build_schedule(year, data) for year in years(data)}
    cell_counts = {str(year): sum(len(row) for row in schedule) for year, schedule in schedules.items()}
    example = compute_pay(2026, 12, 10, 17.06, 197200, True, data)
    return {
        "formula_version": FORMULA_VERSION,
        "coverage": data.adjustments["coverage"],
        "annual_schedule_count": len(schedules),
        "cell_counts": cell_counts,
        "total_cells": sum(cell_counts.values()),
        "all_values_numeric_nonnegative": all(
            isinstance(value, int) and value >= 0 for schedule in schedules.values() for row in schedule for value in row
        ),
        "steps_nondecreasing": all(all(row[i] <= row[i + 1] for i in range(9)) for schedule in schedules.values() for row in schedule),
        "official_2026_matches": official_2026_match_count(data),
        "wrong_shortcut_mismatches": wrong_shortcut_mismatch_count(data),
        "proofs": {
            "2026_gs12_step10_base": example["base"],
            "2026_rest_of_us_annual": example["annual"],
            "2026_rest_of_us_hourly": example["hourly"],
            "2026_rest_of_us_biweekly": example["biweekly"],
            "historical_divisors": {
                "1983": hourly_divisor(1983),
                "1984": hourly_divisor(1984),
            },
            "low_grade_status": derive_from_anchor(1977, 1, 1, data)["status"],
        },
        "status_labels": data.checkpoints["status_labels"],
    }


if __name__ == "__main__":
    import json

    print(json.dumps(validation_receipt(), indent=2, sort_keys=True))
