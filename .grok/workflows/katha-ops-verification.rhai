let meta = #{
    name: "katha-ops-verification",
    description: "Part 2.3 — run ops verification checklist (migrations, dry-run, rollback, CI protection)",
    when_to_use: "Before private beta or when closing launch-gate execution items",
    phases: [
        #{ title: "Probe", detail: "migrations + health + scripts present" },
        #{ title: "Execute", detail: "run verifiers where shell allows" },
        #{ title: "Report", detail: "pass/fail with evidence" },
    ],
};

let item_schema = #{
    "type": "object",
    "required": ["items", "summary"],
    "properties": #{
        "summary": #{ "type": "string" },
        "items": #{
            "type": "array",
            "maxItems": 12,
            "items": #{
                "type": "object",
                "required": ["id", "result", "evidence"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "result": #{ "type": "string" },
                    "evidence": #{ "type": "string" },
                },
            },
        },
    },
};

phase("Probe");
log("Probing ops scripts, migrations, health");

let pp = "";
pp += "Part 2.3 ops verification for Katha. Use read_file/grep/list_dir (and shell if available). ";
pp += "Check presence and purpose of: backend/scripts/verify-wave-migrations.mjs, scripts/production-dry-run.ps1, ";
pp += "any ROLLBACK.md, supabase/migrations 041-046, docs/MVP1_LAUNCH_CHECKLIST.md. ";
pp += "For each of these IDs report result pass|fail|blocked and evidence: ";
pp += "verify_wave_migrations_script, dry_run_script, rollback_doc, migrations_045_046_in_repo, ";
pp += "launch_checklist_updated, github_branch_protection (blocked if cannot access settings). ";
pp += "summary one paragraph. Do not claim production apply without running against prod.";

let probe = agent(pp, #{
    label: "ops-probe",
    capability_mode: "read-only",
    output_schema: item_schema,
});

phase("Execute");
log("Executing local verifiers where possible");

let ep = "";
ep += "Execute what you can of Part 2.3 without live Razorpay cutover. ";
ep += "1) From backend/, try `node scripts/verify-wave-migrations.mjs` if env allows; capture output snippet. ";
ep += "2) Confirm authenticate identity tests: `node --test src/middleware/authenticate.test.js`. ";
ep += "3) Do NOT flip Razorpay live keys. ";
ep += "Report items with id, result pass|fail|blocked, evidence (command output excerpt). ";
ep += "Ids: verify_wave_run, identity_tests_run, razorpay_live_cutover (must be blocked/skipped with reason).";

let exec_r = agent(ep, #{
    label: "ops-execute",
    capability_mode: "execute",
    output_schema: item_schema,
});

phase("Report");

let report = "# Ops verification (Part 2.3)\n\n";
report += "Pass/fail with evidence — not verbal confirmation.\n\n";

if probe != () && probe.success {
    report += "## Probe\n\n" + probe.output.summary + "\n\n";
    if probe.output.items != () {
        report += "| ID | Result | Evidence |\n|---|---|---|\n";
        for it in probe.output.items {
            report += "| " + it.id + " | " + it.result + " | " + it.evidence + " |\n";
        }
        report += "\n";
    }
}

if exec_r != () && exec_r.success {
    report += "## Execute\n\n" + exec_r.output.summary + "\n\n";
    if exec_r.output.items != () {
        report += "| ID | Result | Evidence |\n|---|---|---|\n";
        for it in exec_r.output.items {
            report += "| " + it.id + " | " + it.result + " | " + it.evidence + " |\n";
        }
        report += "\n";
    }
}

report += "## Still founder+eng (not automated here)\n\n";
report += "1. GitHub branch protection blocks merges on failing CI (settings check).\n";
report += "2. Production dry-run green once for real.\n";
report += "3. Rollback rehearsal once for real.\n";
report += "4. Razorpay test→live matrix + ₹1 charge after counsel/soft-launch green.\n";

let path = write_scratch_file("ops-verification.md", report);
complete(#{
    summary: "Ops verification report written",
    path: path,
});
