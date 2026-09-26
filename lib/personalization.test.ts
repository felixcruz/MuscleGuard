import { test } from "node:test";
import assert from "node:assert";
import {
  calculateProteinGoal,
  PROTEIN_MIN_PER_KG,
  PROTEIN_MAX_PER_KG,
} from "./personalization.ts";

const GOALS = ["preserve_muscle", "build_strength", "general_health"] as const;
const DOSES = [0.25, 0.5, 1.0, 1.7, 2.4, 15];
const WEIGHTS = [50, 60, 80, 100, 120];

test("protein target always stays within 1.2 to 1.6 g/kg", () => {
  for (const w of WEIGHTS) {
    for (const g of GOALS) {
      for (const d of DOSES) {
        const total = calculateProteinGoal(w, g, d);
        const perKg = total / w;
        assert.ok(
          perKg >= PROTEIN_MIN_PER_KG - 0.02,
          `perKg ${perKg} below 1.2 for ${g} ${d}mg ${w}kg`
        );
        assert.ok(
          perKg <= PROTEIN_MAX_PER_KG + 0.02,
          `perKg ${perKg} above 1.6 for ${g} ${d}mg ${w}kg`
        );
      }
    }
  }
});

test("base by goal plus a small dose nudge, capped at 1.6", () => {
  // build_strength base 1.5, +0.1 at high dose caps at 1.6
  assert.equal(calculateProteinGoal(80, "build_strength", 0.5), 120); // 1.5
  assert.equal(calculateProteinGoal(80, "build_strength", 2.4), 128); // 1.6 capped
  // preserve_muscle base 1.4
  assert.equal(calculateProteinGoal(80, "preserve_muscle", 0.5), 112); // 1.4
  assert.equal(calculateProteinGoal(80, "preserve_muscle", 1.7), 116); // 1.45
  // general_health base 1.2
  assert.equal(calculateProteinGoal(80, "general_health", 0.5), 96); // 1.2
});

test("a higher dose never lowers the target", () => {
  for (const g of GOALS) {
    let prev = 0;
    for (const d of [0.25, 0.5, 1.0, 1.7, 2.4]) {
      const t = calculateProteinGoal(80, g, d);
      assert.ok(t >= prev, `dose ${d}mg lowered the target for ${g}`);
      prev = t;
    }
  }
});
