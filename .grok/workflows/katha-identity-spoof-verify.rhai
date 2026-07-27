let meta = #{
    name: "katha-identity-spoof-verify",
    description: "Part 2.1 — verify x-creator-id spoofing is closed with tests (Master Workflow)",
    when_to_use: "Before first non-network creator or anytime identity trust is questioned",
    phases: [
        #{ title: "Audit", detail: "scan endpoints for header-based identity" },
        #{ title: "Test", detail: "run automated forge-header tests" },
        #{ title: "Fix", detail: "close any remaining header trust" },
        #{ title: "Report", detail: "confirmed closed or fixed" },
    ],
};

let audit_schema = #{
    "type": "object",
    "required": ["open_issues", "confirmed_safe", "summary"],
    "properties": #{
        "summary": #{ "type": "string" },
        "open_issues": #{
            "type": "array",
            "maxItems": 10,
            "items": #{
                "type": "object",
                "required": ["file", "issue", "severity"],
                "properties": #{
                    "file": #{ "type": "string" },
                    "issue": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                },
            },
        },
        "confirmed_safe": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
    },
};

let fix_mode = "fix";
if args != () && args.fix_mode != () { fix_mode = args.fix_mode; }

phase("Audit");
log("Auditing identity derivation across API (Part 2.1)");

let ap = "";
ap += "Task: Verify SVC-AUTH-06 / identity spoofing is CLOSED (Master Workflow Part 2.1). ";
ap += "Use grep and read_file across backend/src and supabase/functions. ";
ap += "Find every place that could take creator/user identity from a request. ";
ap += "Confirm identity comes only from Authorization Bearer JWT (supabase.auth.getUser / getAuthenticatedUserId / req.auth.userId). ";
ap += "x-creator-id and x-user-id must NOT authorize in production. Mock-only x-user-id is OK if gated by isMockMode(). ";
ap += "List open_issues with file,issue,severity (critical if prod header trust). confirmed_safe = evidence strings of correct patterns. ";
ap += "summary: one sentence. Do not claim closed without reading authenticate.js and route handlers.";

let audit = agent(ap, #{
    label: "identity-audit",
    capability_mode: "read-only",
    output_schema: audit_schema,
});

phase("Test");
log("Running authenticate forge-header unit tests");

let tp = "";
tp += "Run the automated identity-spoof tests for Katha. ";
tp += "In backend/: execute `node --test src/middleware/authenticate.test.js` via shell if available, ";
tp += "or read authenticate.test.js and confirm it asserts: (1) forged x-creator-id without Bearer → null; ";
tp += "(2) invalid Bearer + x-creator-id → null; (3) mock Bearer demo-creator ignores attacker x-creator-id. ";
tp += "Report open_issues empty if tests cover and pass; else list gaps. summary must say pass or fail.";

let test_r = agent(tp, #{
    label: "identity-tests",
    capability_mode: "execute",
    output_schema: audit_schema,
});

let needs_fix = false;
if audit != () && audit.success && audit.output.open_issues != () {
    if audit.output.open_issues.len() > 0 { needs_fix = true; }
}

phase("Fix");
let fixed = false;
if fix_mode == "fix" && needs_fix {
    let fp = "";
    fp += "Fix remaining identity-spoof issues so production never trusts x-creator-id / x-user-id for auth. ";
    fp += "Identity must come from JWT only (resolveAuthFromRequest / getAuthenticatedUserId). ";
    if audit != () && audit.success {
        for iss in audit.output.open_issues {
            fp += "Issue in " + iss.file + ": " + iss.issue + ". ";
        }
    }
    fp += "Use search_replace. Keep MOCK_MODE-only legacy reader header if already gated. Add/adjust unit tests. ";
    fp += "Return confirmed_safe list of what you fixed; open_issues empty if done.";

    let fr = agent(fp, #{
        label: "identity-fix",
        capability_mode: "read-write",
        output_schema: audit_schema,
    });
    if fr != () && fr.success {
        if fr.output.open_issues == () || fr.output.open_issues.len() == 0 {
            fixed = true;
        }
    }
} else {
    log("No fix phase needed or report_only");
}

phase("Report");

let status = "unverified";
if !needs_fix {
    status = "confirmed_closed";
} else if fixed {
    status = "found_open_fixed";
} else {
    status = "found_still_open";
}

let report = "# Identity spoofing verification (Part 2.1)\n\n";
report += "**Status:** `" + status + "`\n\n";
report += "Requirement: report *confirmed closed, test passing* or *found still open, fixed, test passing* — not \"likely fine\".\n\n";

if audit != () && audit.success {
    report += "## Audit\n\n" + audit.output.summary + "\n\n";
    if audit.output.open_issues != () && audit.output.open_issues.len() > 0 {
        report += "### Open issues\n\n";
        for iss in audit.output.open_issues {
            report += "- **" + iss.severity + "** `" + iss.file + "`: " + iss.issue + "\n";
        }
        report += "\n";
    }
    if audit.output.confirmed_safe != () {
        report += "### Safe patterns observed\n\n";
        for s in audit.output.confirmed_safe { report += "- " + s + "\n"; }
        report += "\n";
    }
}

if test_r != () && test_r.success {
    report += "## Tests\n\n" + test_r.output.summary + "\n\n";
}

report += "## Manual command\n\n";
report += "```bash\ncd backend && node --test src/middleware/authenticate.test.js\n```\n";

let path = write_scratch_file("identity-spoof-verify.md", report);
complete(#{
    summary: status,
    path: path,
    status: status,
});
