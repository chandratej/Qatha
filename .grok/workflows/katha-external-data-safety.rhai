let meta = #{
    name: "katha-external-data-safety",
    description: "Part 2.2 + Part 3 — audit/enforce external-LLM-safe data access (no raw prod PII to external AI)",
    when_to_use: "Before any external LLM workflow that needs production-shaped data; monthly safety check",
    phases: [
        #{ title: "Audit", detail: "check external_safe schema and safety doc" },
        #{ title: "Implement", detail: "add missing views/docs if fix_mode=fix" },
        #{ title: "Report", detail: "safety status" },
    ],
};

let audit_schema = #{
    "type": "object",
    "required": ["compliant", "gaps", "summary"],
    "properties": #{
        "compliant": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "gaps": #{
            "type": "array",
            "maxItems": 10,
            "items": #{
                "type": "object",
                "required": ["id", "issue", "fixable"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "issue": #{ "type": "string" },
                    "fixable": #{ "type": "boolean" },
                    "file": #{ "type": "string" },
                },
            },
        },
    },
};

let fix_mode = "fix";
if args != () && args.fix_mode != () { fix_mode = args.fix_mode; }

phase("Audit");
log("Auditing external_safe schema and EXTERNAL_DATA_SAFETY.md");

let ap = "";
ap += "Enforce Katha Master Workflow Part 3 standing rule: no external LLM may receive raw production rows with PII, ";
ap += "payment/payout details, or re-identifiable content. ";
ap += "Audit with read_file/grep/list_dir: ";
ap += "EXTERNAL_DATA_SAFETY.md, supabase/migrations/*external*, supabase/migrations for earnings/creators PII columns, ";
ap += "any scripts that export data. ";
ap += "Expect schema external_safe with masked views creators_masked, earnings_summary, content_stats and a read-only role. ";
ap += "compliant=true only if schema+doc exist and pass the public-forum identity test. ";
ap += "List gaps with fixable=true for repo work. summary one paragraph.";

let audit = agent(ap, #{
    label: "data-safety-audit",
    capability_mode: "read-only",
    output_schema: audit_schema,
});

phase("Implement");
let implemented = false;

let need = true;
if audit != () && audit.success && audit.output.compliant == true {
    need = false;
}

if fix_mode == "fix" && need {
    let fp = "";
    fp += "Implement Part 2.2 external_safe data access layer for Katha. ";
    fp += "1) Create supabase/migrations/047_external_safe_schema.sql with schema external_safe, ";
    fp += "views: creators_masked (no email/phone/legal/UPI/PAN), earnings_summary (aggregates only), ";
    fp += "content_stats (story title, counts, no reader identity). ";
    fp += "2) Create EXTERNAL_DATA_SAFETY.md at repo root documenting the standing rule and how to export for human review only. ";
    fp += "3) No automated pipe from prod to external LLM. ";
    fp += "Use write/search_replace. If creators table column names differ, read migrations first. ";
    fp += "Return compliant=true if shipped; gaps empty.";

    let fr = agent(fp, #{
        label: "data-safety-implement",
        capability_mode: "read-write",
        output_schema: audit_schema,
    });
    if fr != () && fr.success && fr.output.compliant == true {
        implemented = true;
    }
} else {
    log("Implement skipped (compliant or report_only)");
}

phase("Report");

let report = "# External LLM data safety (Part 2.2 / Part 3)\n\n";
report += "> **Standing rule:** No external AI tool ever receives a raw production row containing PII, ";
report += "payment/payout details, or re-identifiable user content.\n\n";

if audit != () && audit.success {
    report += "## Audit\n\n" + audit.output.summary + "\n\n";
    report += "**Compliant (pre-fix):** " + audit.output.compliant.to_string() + "\n\n";
    if audit.output.gaps != () && audit.output.gaps.len() > 0 {
        report += "### Gaps\n\n";
        for g in audit.output.gaps {
            report += "- **" + g.id + "**: " + g.issue + "\n";
        }
        report += "\n";
    }
}

report += "**Implement ran:** " + implemented.to_string() + " (fix_mode=" + fix_mode + ")\n\n";
report += "## Allowed inputs to external AI\n\n";
report += "- Schema definitions / migrations (no row data)\n";
report += "- Masked views under `external_safe` (after human export review)\n";
report += "- Synthetic/seed data (`MOCK_MODE`)\n";
report += "- Application code\n\n";
report += "## Forbidden\n\n";
report += "- Raw `creators` / `profiles` rows with contact or KYC fields\n";
report += "- Per-creator exact payouts tied to identity\n";
report += "- Reader identities or contact lists\n";
report += "- Automated prod → external LLM pipelines\n";

let path = write_scratch_file("external-data-safety.md", report);
complete(#{
    summary: if implemented { "external_safe implemented/updated" } else { "external data safety audited" },
    path: path,
    implemented: implemented,
});
