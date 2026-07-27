let meta = #{
    name: "mvp1-product-workflow-audit",
    description: "Audit Katha MVP1 product workflow end-to-end, verify gaps, and fix code/doc blockers",
    when_to_use: "Before soft launch or after deploy: validate creator→reader journey against MVP1 checklist and fix confirmed gaps",
    phases: [
        #{ title: "Map", detail: "enumerate product workflow stages for MVP1" },
        #{ title: "Audit", detail: "parallel journey audits against code and checklist" },
        #{ title: "Verify", detail: "adversarial confirmation of each gap" },
        #{ title: "Fix", detail: "implement confirmed code/doc fixes" },
        #{ title: "Report", detail: "write launch readiness report" },
    ],
};

let gaps_schema = #{
    "type": "object",
    "required": ["gaps", "stage_ok"],
    "properties": #{
        "stage_ok": #{ "type": "boolean" },
        "gaps": #{
            "type": "array",
            "maxItems": 10,
            "items": #{
                "type": "object",
                "required": ["id", "summary", "level", "evidence", "fixable"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "summary": #{ "type": "string" },
                    "level": #{ "type": "string" },
                    "evidence": #{ "type": "string" },
                    "fixable": #{ "type": "boolean" },
                    "file": #{ "type": "string" },
                },
            },
        },
    },
};

let verdict_schema = #{
    "type": "object",
    "required": ["real", "reason", "evidence"],
    "properties": #{
        "real": #{ "type": "boolean" },
        "reason": #{ "type": "string" },
        "evidence": #{ "type": "string" },
    },
};

let fix_schema = #{
    "type": "object",
    "required": ["fixed", "summary", "files_touched"],
    "properties": #{
        "fixed": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "files_touched": #{
            "type": "array",
            "maxItems": 20,
            "items": #{ "type": "string" },
        },
    },
};

// Optional: args.fix_mode = "report_only" | "fix" (default fix)
let fix_mode = "fix";
if args != () && args.fix_mode != () {
    fix_mode = args.fix_mode;
}

// ── Map ──────────────────────────────────────────────────────────────
phase("Map");
log("Mapping MVP1 product workflow stages from docs + app routes");

let map_prompt = "";
map_prompt += "You are auditing Katha MVP1 soft-launch product workflow. ";
map_prompt += "Use read_file and grep only. Read these paths if they exist: ";
map_prompt += "docs/MVP1_LAUNCH_CHECKLIST.md, creator-cms/src/App.tsx, creator-cms/src/lib/releaseChecklist.ts, ";
map_prompt += "packages/shared/formatEligibility.ts, packages/shared/content-types.ts, ";
map_prompt += "creator-cms/src/pages/CreateStory.tsx, backend/src/routes/creators.js, ";
map_prompt += "backend/src/services/accessControl.js, backend/src/services/freeChapterThreshold.js. ";
map_prompt += "List the ordered end-user product stages for soft launch (creator + reader). ";
map_prompt += "Do not invent stages not supported by code/docs. Return gaps=[] and stage_ok=true. ";
map_prompt += "Put the stage list in evidence of a single gap-like note only if needed; prefer empty gaps.";

let map_r = agent(map_prompt, #{
    label: "map-stages",
    capability_mode: "read-only",
    output_schema: gaps_schema,
});
if map_r == () || !map_r.success {
    log("Map agent failed — continuing with fixed stage list");
}

// Fixed deterministic stage list (script enforces scope; agents verify each)
let stages = [
    "auth_onboarding",
    "create_story",
    "write_publish",
    "earn_monetize",
    "reader_funnel",
    "infra_ops",
];

// ── Audit (parallel per stage) ───────────────────────────────────────
phase("Audit");
log("Auditing " + stages.len().to_string() + " product workflow stages in parallel");

let audit_jobs = [];
let i = 0;
for st in stages {
    let p = "";
    p += "Audit Katha MVP1 product workflow stage: " + st + ". ";
    p += "Use grep, read_file, and list_dir on the MVP repo only. Do not answer from memory. ";
    p += "Read docs/MVP1_LAUNCH_CHECKLIST.md and the code that implements this stage. ";

    if st == "auth_onboarding" {
        p += "Check Login, AuthContext, OnboardingGate, LegalConsentGate, ProtectedRoute. ";
        p += "Gaps: broken session, mock-only auth forced in prod, missing consent. ";
    }
    if st == "create_story" {
        p += "Check CreateStory.tsx, api.createStory, supabaseData sbCreateStory, TeluguTextField, storyCover. ";
        p += "Gaps: cover required at create, recursion on story_members, Telugu rejected, genres enum, drafts missing from list. ";
    }
    if st == "write_publish" {
        p += "Check ChapterEditor publish path, cover gate at publish, word bands, moderation. ";
        p += "Gaps: publish with default cover allowed, serial word floor forced on flash/chat, drafts not saved. ";
    }
    if st == "earn_monetize" {
        p += "Check formatEligibility, readerTiers, monetizationEligibility, Monetization.tsx, revenue.js. ";
        p += "Gaps: missing unit gate 50/5, missing tier UI, non-monetized formats still eligible, coins UX. ";
    }
    if st == "reader_funnel" {
        p += "Check freeChapterThreshold, accessControl, handoff docs, gateway paywall if present. ";
        p += "Gaps: Option B continue-after-signup missing, hard paywall wrong chapter, collection story1 not free. ";
    }
    if st == "infra_ops" {
        p += "Check migrations 045/046 files, vercel.cms.json monorepo packages path, deploy scripts, API health path. ";
        p += "Gaps: Vercel root excludes packages/shared, migrations not in repo, checklist stale. ";
    }

    p += "Report at most 8 concrete gaps as {id,summary,level,evidence,fixable,file}. ";
    p += "level must be one of: critical, major, minor. fixable=true only for code/docs in this repo (not Razorpay dashboard or human QA). ";
    p += "stage_ok=true only if no critical/major gaps after reading code. Empty gaps is valid only after tools ran.";

    audit_jobs.push(#{
        prompt: p,
        label: "audit:" + st,
        capability_mode: "read-only",
        output_schema: gaps_schema,
    });
    i += 1;
}

let audit_results = parallel(audit_jobs);

let all_gaps = [];
for r in audit_results {
    if r != () && r.success && r.output.gaps != () {
        for g in r.output.gaps {
            // Keep only structured-looking gaps with evidence
            if g != () && g.id != () && g.evidence != () && g.evidence != "" {
                all_gaps.push(g);
            }
        }
    }
}

log("Collected " + all_gaps.len().to_string() + " raw gaps before verification");

if all_gaps.len() == 0 {
    let report = "# MVP1 product workflow audit\n\nNo gaps reported by stage auditors after code inspection.\n";
    report += "Stages checked: auth_onboarding, create_story, write_publish, earn_monetize, reader_funnel, infra_ops.\n";
    let path = write_scratch_file("mvp1-workflow-audit.md", report);
    complete(#{
        summary: "No gaps found in product workflow audit",
        path: path,
        confirmed: [],
        fixed: [],
    });
}

// Cap verified fan-out
let MAX_GAPS = 12;
if all_gaps.len() > MAX_GAPS {
    log("Truncating gaps from " + all_gaps.len().to_string() + " to " + MAX_GAPS.to_string());
    let trimmed = [];
    let j = 0;
    for g in all_gaps {
        if j < MAX_GAPS { trimmed.push(g); }
        j += 1;
    }
    all_gaps = trimmed;
}

// ── Verify ───────────────────────────────────────────────────────────
phase("Verify");
log("Adversarially verifying " + all_gaps.len().to_string() + " gaps");

let vjobs = [];
for g in all_gaps {
    let vp = "";
    vp += "Adversarially verify this claimed product-workflow gap by reading the shipped repo code. ";
    vp += "Claim id=" + g.id + " level=" + g.level + ". ";
    vp += "Summary: " + g.summary + ". ";
    vp += "Claimed evidence: " + g.evidence + ". ";
    if g.file != () { vp += "File hint: " + g.file + ". "; }
    vp += "Use read_file/grep. Set real=true ONLY if the gap still exists in code/docs with concrete evidence you inspected. ";
    vp += "If already fixed, outdated, or human-ops-only (Razorpay dashboard, father QA), set real=false. ";
    vp += "Prefer real=false when uncertain.";

    let lab = "verify:" + g.id;
    vjobs.push(#{
        prompt: vp,
        label: lab,
        capability_mode: "read-only",
        output_schema: verdict_schema,
    });
}
let verdicts = parallel(vjobs);

let confirmed = [];
let vi = 0;
for v in verdicts {
    if v != () && v.success && v.output.real == true
        && v.output.evidence != () && v.output.evidence != "" {
        let cg = all_gaps[vi];
        // annotate with verifier evidence
        confirmed.push(cg);
    }
    vi += 1;
}

log(confirmed.len().to_string() + "/" + all_gaps.len().to_string() + " gaps confirmed");

// ── Fix ──────────────────────────────────────────────────────────────
phase("Fix");
let fixed_summaries = [];

if fix_mode == "report_only" {
    log("fix_mode=report_only — skipping code fixes");
} else if confirmed.len() == 0 {
    log("No confirmed gaps to fix");
} else {
    // Prefer critical/major fixable gaps first (script filter)
    let to_fix = [];
    for g in confirmed {
        if g.fixable == true {
            if g.level == "critical" || g.level == "major" {
                to_fix.push(g);
            }
        }
    }
    // Add minor fixable if room
    if to_fix.len() < 6 {
        for g in confirmed {
            if g.fixable == true && g.level == "minor" {
                let already = false;
                for t in to_fix {
                    if t.id == g.id { already = true; }
                }
                if !already && to_fix.len() < 6 { to_fix.push(g); }
            }
        }
    }

    log("Fixing up to " + to_fix.len().to_string() + " confirmed fixable gaps");

    // Sequential fixes to avoid worktree isolation merge issues (shared workspace)
    for g in to_fix {
        let fp = "";
        fp += "Fix this confirmed Katha MVP1 product-workflow gap. ";
        fp += "Gap id=" + g.id + " level=" + g.level + ". ";
        fp += "Summary: " + g.summary + ". ";
        fp += "Evidence: " + g.evidence + ". ";
        if g.file != () { fp += "Start at file: " + g.file + ". "; }
        fp += "Use read_file/grep, then search_replace/write to implement a minimal correct fix. ";
        fp += "Do not expand scope. Do not invent product policy. Align with docs/MVP1_LAUNCH_CHECKLIST.md and Format Spec v1. ";
        fp += "If the gap is ops-only and cannot be fixed in code, set fixed=false and explain. ";
        fp += "Return fixed, summary of what changed, files_touched.";

        let fr = agent(fp, #{
            label: "fix:" + g.id,
            capability_mode: "read-write",
            output_schema: fix_schema,
        });

        if fr != () && fr.success && fr.output.fixed == true {
            fixed_summaries.push(#{
                id: g.id,
                summary: fr.output.summary,
                files: fr.output.files_touched,
            });
        } else {
            let why = "fix failed or not applied";
            if fr != () && fr.success && fr.output.summary != () {
                why = fr.output.summary;
            }
            log("Unfixed " + g.id + ": " + why);
        }
    }
}

// ── Report ───────────────────────────────────────────────────────────
phase("Report");

let report = "# Katha MVP1 product workflow audit report\n\n";
report += "Stages audited: auth_onboarding → create_story → write_publish → earn_monetize → reader_funnel → infra_ops.\n\n";
report += "## Summary\n\n";
report += "- Raw gaps: " + all_gaps.len().to_string() + "\n";
report += "- Confirmed: " + confirmed.len().to_string() + "\n";
report += "- Fixed: " + fixed_summaries.len().to_string() + "\n";
report += "- fix_mode: " + fix_mode + "\n\n";

report += "## Confirmed gaps\n\n";
if confirmed.len() == 0 {
    report += "_None._\n\n";
} else {
    for g in confirmed {
        report += "### " + g.id + " (" + g.level + ")\n";
        report += g.summary + "\n\n";
        report += "Evidence: " + g.evidence + "\n\n";
        if g.file != () { report += "File: `" + g.file + "`\n\n"; }
    }
}

report += "## Fixes applied\n\n";
if fixed_summaries.len() == 0 {
    report += "_None._\n\n";
} else {
    for f in fixed_summaries {
        report += "- **" + f.id + "**: " + f.summary + "\n";
    }
    report += "\n";
}

report += "## Residual human / ops gates\n\n";
report += "Still require humans even if code is clean: Razorpay Dashboard webhook 2xx, ";
report += "father/senior creator dry-run, reader APK Option B QA, founder go/no-go.\n";
report += "See docs/MVP1_LAUNCH_CHECKLIST.md.\n";

let path = write_scratch_file("mvp1-workflow-audit.md", report);
complete(#{
    summary: confirmed.len().to_string() + " confirmed gaps, " + fixed_summaries.len().to_string() + " fixed",
    path: path,
    confirmed_count: confirmed.len(),
    fixed_count: fixed_summaries.len(),
    fix_mode: fix_mode,
});
