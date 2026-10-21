import ts from "typescript";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const dir = mkdtempSync(join(tmpdir(), "fintrack-tests-"));
try {
  for (const name of ["clientRevenueCalculations", "clientRevenueOperations"])
    writeFileSync(
      join(dir, name + ".js"),
      ts.transpileModule(readFileSync(`src/utils/${name}.ts`, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    );
  const require = createRequire(import.meta.url),
    { batchOperations } = require(join(dir, "clientRevenueOperations.js"));
  const base = {
    id: "b",
    clientId: "c",
    batchName: "Test",
    committedValue: 1000,
    committedVideos: 10,
    startDate: "2026-10-01",
    expectedEndDate: "",
    status: "active",
    notes: "",
    createdAt: "2026-10-01",
  };
  const payment = (amount) => [
    {
      id: "p",
      batchId: "b",
      amount,
      date: "2026-10-01",
      receivedIn: "Business",
      notes: "",
    },
  ];
  const delivery = (n) => [
    {
      id: "d",
      batchId: "b",
      videosCompleted: n,
      date: "2026-10-02",
      notes: "",
    },
  ];
  const run = (amount, delivered = 0, batch = base) =>
    batchOperations(
      batch,
      amount === null ? [] : payment(amount),
      delivered ? delivery(delivered) : [],
      [],
      "2026-10-21",
    );
  assert.equal(run(null).paymentStatus, "Unpaid");
  assert.equal(run(500).remaining, 500);
  assert.equal(run(500).paymentStatus, "Part-paid");
  assert.equal(run(950).remaining, 50, "Exactly ₹50 is not ignored");
  assert.equal(run(950.01).remaining, 0);
  assert.equal(run(1049.99).credit, 0);
  assert.equal(run(1050).credit, 50);
  assert.equal(run(1000).paymentStatus, "Fully paid");
  assert.equal(
    run(null, 0, { ...base, committedValue: 40 }).paymentStatus,
    "Unpaid",
  );
  assert.equal(
    run(null, 0, { ...base, committedValue: 40 }).remaining,
    40,
    "Unpaid small contracts must not disappear",
  );
  assert.equal(
    run(1006, 10).unearnedAdvance,
    0,
    "Completed FX residual is not unearned work",
  );
  assert.equal(
    run(1000, 5).unearnedAdvance,
    500,
    "Real paid undelivered work is retained",
  );
  assert.equal(run(500).needsConfirmation, true);
  assert.equal(run(1000, 10).needsConfirmation, false);
  assert.equal(
    run(1000, 2, { ...base, expectedEndDate: "2026-10-10" }).overdue,
    true,
  );
  assert.equal(
    run(500, 2, { ...base, status: "ended_early" }).needsConfirmation,
    false,
  );
  assert.equal(
    run(500, 2, { ...base, status: "ended_early" }).nextStep,
    "Review final agreement",
  );
  assert.equal(run(1000).deliveryStatus, "No delivery recorded");
  assert.equal(run(1000, 10).deliveryStatus, "Delivered");
  assert.equal(run(994, 10).receivable, 0);
  assert.equal(run(950, 10).receivable, 50);
  console.log("20 client revenue calculation checks passed.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
