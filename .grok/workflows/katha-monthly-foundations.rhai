let meta = #{
    name: "katha-monthly-foundations",
    description: "Part B monthly foundations + security + vendor hygiene (Master Workflow 1.3 / 4.2)",
    when_to_use: "Month-start or quarter-start (~1 hour founder block)",
    phases: [
        #{ title: "Scan", detail: "security + foundations + launch checklist status" },
        #{ title: "Report", detail: "monthly foundations tracker update" },
    ],
};

let scan_schema = #{
    "type": "object",
    "required": ["items", "open_undated", "summary"],
    "properties": #{
        "summary": #{ "type": "string" },
        "open_undated": #{ "type": "number" },
        "items": #{
            "type": "array",
            "maxItems": 16,
            "items": #{
                "type": "object",
                "required": ["id", "title", "status", "owner", "risk"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "title": #{ "type": "string" },
                    "status": #{ "type": "string" },
                    "owner": #{ "type": "string" },
                    "risk": #{ "type": "string" },
                    "next_action": #{ "type": "string" },
                },
            },
        },
    },
};

phase("Scan");
log("Monthly foundations + security deviation scan");

let jobs = [];

let p1 = "";
p1 += "Audit Katha foundations tracker items from Master Workflow §4.2 and docs/MVP1_LAUNCH_CHECKLIST.md. ";
p1 += "Use read_file/grep on: docs/MVP1_LAUNCH_CHECKLIST.md, docs/MVP1_PRODUCT_WORKFLOW_AUDIT.md, ";
p1 += "docs/decisions/DEC-030_format_spec_v1_monetization_tiers.md, EXTERNAL_DATA_SAFETY.md if present, ";
p1 += "supabase/migrations (041, 045, 046). ";
p1 += "For each active foundation item (Agreement, DPDP, RBI, grievance, identity-spoof, backup) report ";
p1 += "{id,title,status,owner,risk,next_action}. Count open_undated items (status open without target date). ";
p1 += "summary one paragraph. No production PII.";

jobs.push(#{
    prompt: p1,
    label: "foundations-scan",
    capability_mode: "read-only",
    output_schema: scan_schema,
});

let p2 = "";
p2 += "Security monthly review for Katha: scan code for open TODOs related to auth spoofing, x-creator-id, ";
p2 += "consent fail-open, MOCK_MODE in prod, webhook secrets. Use grep/read_file on backend/src/middleware, ";
p2 += "creator-cms/src/lib/supabase.ts, creator-cms/src/components/LegalConsentGate.tsx. ";
p2 += "Report items with id,title,status,owner,risk,next_action. open_undated = count without clear resolution. ";
p2 += "summary one paragraph.";

jobs.push(#{
    prompt: p2,
    label: "security-scan",
    capability_mode: "read-only",
    output_schema: scan_schema,
});

let results = parallel(jobs);

phase("Report");

let report = "# Katha monthly foundations tracker\n\n";
report += "Cadence: monthly (~1 hr). Source: Master Workflow Part 1.3 / §4.2.\n\n";

let total_undated = 0;
let ri = 0;
for r in results {
    let title = if ri == 0 { "Foundations" } else { "Security" };
    report += "## " + title + "\n\n";
    if r != () && r.success {
        report += r.output.summary + "\n\n";
        if r.output.open_undated != () {
            total_undated = total_undated + r.output.open_undated;
        }
        if r.output.items != () {
            report += "| ID | Title | Status | Owner | Risk | Next |\n|---|---|---|---|---|---|\n";
            for it in r.output.items {
                let na = if it.next_action != () { it.next_action } else { "—" };
                report += "| " + it.id + " | " + it.title + " | " + it.status + " | " + it.owner;
                report += " | " + it.risk + " | " + na + " |\n";
            }
            report += "\n";
        }
    } else {
        report += "_Scan failed — re-run workflow._\n\n";
    }
    ri += 1;
}

report += "## Part B checklist (founder ticks offline)\n\n";
report += "- [ ] Security review: every open deviation has a resolution date\n";
report += "- [ ] Foundations Tracker updated (this table)\n";
report += "- [ ] Subscription & vendor register — cancel unused 60+ days\n";
report += "- [ ] North Star metric light check\n";
report += "- [ ] (Quarterly) Backup/recovery spot-check\n\n";
report += "**Open undated signals (approx):** " + total_undated.to_string() + "\n";
report += "Escalate anything undated past one cycle.\n";

let path = write_scratch_file("monthly-foundations.md", report);
complete(#{
    summary: "Monthly foundations brief written",
    path: path,
    open_undated: total_undated,
});
