let meta = #{
    name: "katha-product-smoke-ux",
    description: "Product smoke/sanity + visual communication, UI/UX, CSS, eye comfort, ergonomics",
    when_to_use: "Before soft launch, after UI deploys, or when validating Creator Studio comfort/visibility for senior/Telugu users",
    phases: [
        #{ title: "Scope", detail: "resolve surface and checklist anchors" },
        #{ title: "Smoke", detail: "functional product sanity against code/routes" },
        #{ title: "Visual", detail: "parallel UI/UX/CSS/comfort/ergonomics review" },
        #{ title: "Verify", detail: "adversarial confirmation of findings" },
        #{ title: "Report", detail: "write product smoke + visual report" },
    ],
};

let smoke_schema = #{
    "type": "object",
    "required": ["summary", "items", "blocker_count"],
    "properties": #{
        "summary": #{ "type": "string" },
        "blocker_count": #{ "type": "integer" },
        "items": #{
            "type": "array",
            "maxItems": 16,
            "items": #{
                "type": "object",
                "required": ["id", "result", "evidence"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "result": #{ "type": "string" },
                    "evidence": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                },
            },
        },
    },
};

let findings_schema = #{
    "type": "object",
    "required": ["findings", "summary", "dimension"],
    "properties": #{
        "dimension": #{ "type": "string" },
        "summary": #{ "type": "string" },
        "findings": #{
            "type": "array",
            "maxItems": 8,
            "items": #{
                "type": "object",
                "required": ["id", "file", "issue", "severity", "area"],
                "properties": #{
                    "id": #{ "type": "string" },
                    "file": #{ "type": "string" },
                    "issue": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                    "area": #{ "type": "string" },
                    "suggestion": #{ "type": "string" },
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

// ── Args ─────────────────────────────────────────────────────────────
// surface: creator-cms | all (default creator-cms)
// fix_mode: report_only | fix (default report_only — UI changes need human taste)
// focus: optional free text (e.g. "legal consent", "editor comfort", "mobile nav")

let surface = "creator-cms";
let fix_mode = "report_only";
let focus = "";
if args != () {
    if args.surface != () { surface = args.surface; }
    if args.fix_mode != () { fix_mode = args.fix_mode; }
    if args.focus != () { focus = args.focus; }
}

// ── Scope ────────────────────────────────────────────────────────────
phase("Scope");
log("Scoping product smoke + visual review for surface=" + surface);

let scope_note = "Surface: " + surface + ". Focus: ";
if focus == "" {
    scope_note += "(full Studio defaults)";
} else {
    scope_note += focus;
}
log(scope_note);

// ── Smoke ────────────────────────────────────────────────────────────
phase("Smoke");
log("Running product functional smoke against code and checklist");

let sp = "";
sp += "You are the Katha product SMOKE / SANITY checker for Creator Studio (MVP1 soft launch). ";
sp += "Use ONLY read-only tools: read_file, grep, list_dir. Do not invent behavior — open the files. ";
sp += "Primary tree: creator-cms/src (App.tsx routes, pages, components, lib, config, styles). ";
sp += "Also check: docs/MVP1_LAUNCH_CHECKLIST.md, creator-cms/src/lib/releaseChecklist.ts, ";
sp += "creator-cms/src/config/api_config.ts, creator-cms/src/components/LegalConsentGate.tsx, ";
sp += "creator-cms/src/components/OnboardingGate.tsx, creator-cms/src/context/ThemeContext.tsx, ";
sp += "creator-cms/src/lib/comfortPrefs.ts, creator-cms/src/components/TeluguTextField.tsx, ";
sp += "creator-cms/src/pages/Login.tsx, CreateStory.tsx, ChapterEditor.tsx, Dashboard.tsx, Settings.tsx, ";
sp += "ReleaseChecklist.tsx, Earn.tsx, Profile.tsx. ";
if surface == "all" {
    sp += "Also briefly note reader-app or gateway docs if present (reader-app/, gateway paths). ";
}
if focus != "" {
    sp += "User focus (prioritize): " + focus + ". ";
}
sp += "For each ID below report result pass|fail|warn|blocked with evidence (file + what you saw). ";
sp += "IDs: routes_core_present, legal_consent_gate, onboarding_gate, api_url_resolver, ";
sp += "release_checklist_page, create_story_no_cover_path, telugu_input_path, comfort_prefs_wired, ";
sp += "theme_toggle_present, mock_mode_prod_guard, mobile_tab_bar, error_boundaries, ";
sp += "auth_login_page, dashboard_entry, earn_hub_entry, settings_entry. ";
sp += "blocker_count = number of items with result fail. ";
sp += "summary: one paragraph on whether Studio can be smoke-tested end-to-end in code terms. ";
sp += "Do NOT claim live browser/prod QA passed — this is static smoke of the product surface.";

let smoke = agent(sp, #{
    label: "product-smoke",
    capability_mode: "read-only",
    output_schema: smoke_schema,
});

// ── Visual parallel dimensions ───────────────────────────────────────
phase("Visual");
log("Parallel visual communication / UI-UX / CSS / eye comfort / ergonomics");

let base_paths = "";
base_paths += "Inspect real files under creator-cms/src/styles/ (design-tokens.css, theme.css, ";
base_paths += "comfort-system.css, editor-eye-comfort.css, studio.css, nav-v2.css, motion-system.css, ";
base_paths += "empty-state-system.css, layout-rhythm-v2.css, auth-premium.css, dashboard-premium.css) ";
base_paths += "and components: Layout.tsx, AppTopNav.tsx, AppMobileTabBar.tsx, ThemeToggle.tsx, ";
base_paths += "LegalConsentGate.tsx, TeluguTextField.tsx, Editor/EditorComfortControls.tsx, ";
base_paths += "pages Login/Dashboard/CreateStory/ChapterEditor/Settings. ";
base_paths += "Use grep/read_file. Empty findings only after reading code. Max 8 findings. ";
base_paths += "severity: blocker|major|minor|nit. area: visual|ux|css|comfort|a11y|ergonomics. ";
if focus != "" {
    base_paths += "Prioritize focus: " + focus + ". ";
}

let jobs = [];

// 1 visual communication
let p0 = "";
p0 += "Katha Creator Studio VISUAL COMMUNICATION review. Dimension id=visual_communication. ";
p0 += base_paths;
p0 += "Check: primary CTA hierarchy, form labels vs hints, error alert visibility, Legal Consent copy, ";
p0 += "empty states, badge/status color meaning, Telugu+English bilingual clarity. ";
p0 += "Report dimension=visual_communication, findings with id/file/issue/severity/area/suggestion, summary.";
jobs.push(#{
    prompt: p0,
    label: "ux:visual_communication",
    capability_mode: "read-only",
    output_schema: findings_schema,
});

// 2 eye comfort
let p1 = "";
p1 += "Katha Creator Studio EYE COMFORT & VISIBILITY review. Dimension id=eye_comfort. ";
p1 += base_paths;
p1 += "Check: contrast on body/muted text, editor line-height and font-size, comfort-system.css, ";
p1 += "editor-eye-comfort.css, comfortPrefs, senior-friendly density, Telugu font stack coverage, ";
p1 += "reduced-motion respect, glare-y pure white vs warm paper, dark-mode readability. ";
p1 += "Report dimension=eye_comfort, findings with id/file/issue/severity/area/suggestion, summary.";
jobs.push(#{
    prompt: p1,
    label: "ux:eye_comfort",
    capability_mode: "read-only",
    output_schema: findings_schema,
});

// 3 css consistency
let p2 = "";
p2 += "Katha Creator Studio CSS & DESIGN SYSTEM consistency review. Dimension id=css_consistency. ";
p2 += base_paths;
p2 += "Check: design-tokens.css usage vs hard-coded hex in TSX style props, spacing scale, ";
p2 += "z-index stacking for nav/modals, conflicting premium CSS waves, broken class names, ";
p2 += "responsive breakpoints for mobile tab bar vs top nav. ";
p2 += "Report dimension=css_consistency, findings with id/file/issue/severity/area/suggestion, summary.";
jobs.push(#{
    prompt: p2,
    label: "ux:css_consistency",
    capability_mode: "read-only",
    output_schema: findings_schema,
});

// 4 ergonomics / a11y
let p3 = "";
p3 += "Katha Creator Studio ERGONOMICS & ACCESSIBILITY review. Dimension id=ergonomics_a11y. ";
p3 += base_paths;
p3 += "Check: touch target size (~44px), button disabled state communication, keyboard reach for editor, ";
p3 += "modal focus and Esc, aria-labelledby on dialogs, form error association, ";
p3 += "loading shells aria-busy, mobile thumb-zone nav, long Telugu labels overflow. ";
p3 += "Report dimension=ergonomics_a11y, findings with id/file/issue/severity/area/suggestion, summary.";
jobs.push(#{
    prompt: p3,
    label: "ux:ergonomics_a11y",
    capability_mode: "read-only",
    output_schema: findings_schema,
});

let visual_results = parallel(jobs);

// Collect findings (cap for verify budget)
let all_findings = [];
let dim_summaries = [];
let MAX_VERIFY = 10;

for r in visual_results {
    if r != () && r.success && r.output != () {
        if r.output.summary != () {
            dim_summaries.push(#{
                dimension: r.output.dimension,
                summary: r.output.summary,
            });
        }
        if r.output.findings != () {
            for f in r.output.findings {
                // Require a concrete file path; drop empty/missing
                if f.file != () && f.file != "" && f.issue != () && f.issue != "" {
                    all_findings.push(f);
                } else {
                    log("Dropped finding with missing file/issue");
                }
            }
        }
    }
}

// Truncate for verification panel
let to_verify = [];
let dropped = 0;
for f in all_findings {
    if to_verify.len() < MAX_VERIFY {
        to_verify.push(f);
    } else {
        dropped += 1;
    }
}
if dropped > 0 {
    log("Truncated " + dropped.to_string() + " findings before verify (cap " + MAX_VERIFY.to_string() + ")");
}

// ── Verify ───────────────────────────────────────────────────────────
phase("Verify");
log("Adversarially verifying " + to_verify.len().to_string() + " findings");

let confirmed = [];
if to_verify.len() > 0 {
    let vjobs = [];
    for f in to_verify {
        let vp = "";
        vp += "Adversarially verify this Katha UI/UX finding by re-reading the shipped file. ";
        vp += "Finding: " + f.issue + " | file: " + f.file + " | severity claimed: " + f.severity + ". ";
        vp += "Use read_file/grep on that path. Set real=true ONLY with concrete evidence from the file ";
        vp += "(quote a line/snippet in evidence). If speculative, outdated, or not visible in code, real=false. ";
        vp += "Prefer real=false when unsure.";
        vjobs.push(#{
            prompt: vp,
            label: "verify:" + f.id,
            capability_mode: "read-only",
            output_schema: verdict_schema,
        });
    }
    let verdicts = parallel(vjobs);
    let vi = 0;
    for v in verdicts {
        if v != () && v.success && v.output != () && v.output.real == true {
            if v.output.evidence != () && v.output.evidence != "" {
                let item = to_verify[vi];
                confirmed.push(#{
                    id: item.id,
                    file: item.file,
                    issue: item.issue,
                    severity: item.severity,
                    area: item.area,
                    suggestion: if item.suggestion != () { item.suggestion } else { "" },
                    evidence: v.output.evidence,
                });
            }
        }
        vi += 1;
    }
}

log(confirmed.len().to_string() + "/" + to_verify.len().to_string() + " findings confirmed");

// Optional fix phase only when explicitly requested — small CSS/copy only
if fix_mode == "fix" && confirmed.len() > 0 {
    phase("Report");
    log("fix_mode=fix — attempting low-risk fixes for confirmed minor/nit only");
    let fp = "";
    fp += "Implement ONLY low-risk confirmed UI fixes for Katha Creator Studio. ";
    fp += "Confirmed findings (JSON-ish list follows). Only touch creator-cms CSS/TSX for minor|nit ";
    fp += "severity (contrast tokens, aria-labels, missing class). Do NOT change product policy, ";
    fp += "auth, monetization, or large layouts. Use search_replace. If nothing is safely fixable, touch nothing. ";
    let n = 0;
    for c in confirmed {
        if n < 5 {
            fp += " [" + c.id + " | " + c.severity + " | " + c.file + " | " + c.issue + "]";
        }
        n += 1;
    }
    let _fix_r = agent(fp, #{
        label: "ux-low-risk-fix",
        capability_mode: "read-write",
    });
} else {
    phase("Report");
}

// ── Report ───────────────────────────────────────────────────────────
log("Writing product smoke + visual sanity report");

let report = "";
report += "# Katha product smoke + visual sanity\n\n";
report += "> Static code review + structured smoke — not a substitute for live browser QA.\n\n";
report += "- **Surface:** " + surface + "\n";
let focus_label = focus;
if focus_label == "" { focus_label = "(full Studio)"; }
report += "- **Focus:** " + focus_label + "\n";
report += "- **Fix mode:** " + fix_mode + "\n\n";

report += "## Functional smoke\n\n";
if smoke != () && smoke.success && smoke.output != () {
    report += smoke.output.summary + "\n\n";
    report += "**Blockers (fail count):** " + smoke.output.blocker_count.to_string() + "\n\n";
    if smoke.output.items != () {
        report += "| ID | Result | Evidence |\n|---|---|---|\n";
        for it in smoke.output.items {
            report += "| " + it.id + " | " + it.result + " | " + it.evidence + " |\n";
        }
        report += "\n";
    }
} else {
    report += "_Smoke agent failed or returned no usable output._\n\n";
}

report += "## Visual / UX dimensions\n\n";
for ds in dim_summaries {
    let dname = if ds.dimension != () { ds.dimension } else { "dimension" };
    report += "### " + dname + "\n\n";
    report += ds.summary + "\n\n";
}

report += "## Confirmed findings (survived verification)\n\n";
if confirmed.len() == 0 {
    report += "_No findings survived adversarial verification (or none reported)._\n\n";
} else {
    report += "| ID | Severity | Area | File | Issue |\n|---|---|---|---|---|\n";
    for c in confirmed {
        report += "| " + c.id + " | " + c.severity + " | " + c.area + " | `" + c.file + "` | " + c.issue + " |\n";
    }
    report += "\n";
    report += "### Evidence & suggestions\n\n";
    for c in confirmed {
        report += "#### " + c.id + "\n\n";
        report += "- **Issue:** " + c.issue + "\n";
        report += "- **Evidence:** " + c.evidence + "\n";
        if c.suggestion != () && c.suggestion != "" {
            report += "- **Suggestion:** " + c.suggestion + "\n";
        }
        report += "\n";
    }
}

report += "## Human residual (cannot fully automate)\n\n";
report += "1. Live production hard-refresh of Legal Consent + Login (Vercel deploy).\n";
report += "2. Father/senior dry-run: Telugu fields, contrast, comfort controls.\n";
report += "3. Mobile phone: tab bar reach, Create Story form, editor toolbar.\n";
report += "4. Theme toggle light/dark on Dashboard + Editor.\n";
report += "5. `/release-checklist` interactive pass on production URL.\n\n";

report += "## How to re-run\n\n";
report += "```\n";
report += "/katha-product-smoke-ux\n";
report += "# or with args:\n";
report += "# { \"surface\": \"creator-cms\", \"focus\": \"legal consent\", \"fix_mode\": \"report_only\" }\n";
report += "```\n";

let path = write_scratch_file("product-smoke-ux.md", report);

let smoke_blockers = 0;
if smoke != () && smoke.success && smoke.output != () && smoke.output.blocker_count != () {
    smoke_blockers = smoke.output.blocker_count;
}

complete(#{
    summary: "Smoke blockers=" + smoke_blockers.to_string()
        + "; confirmed UX findings=" + confirmed.len().to_string(),
    path: path,
    smoke_blockers: smoke_blockers,
    confirmed_count: confirmed.len(),
    surface: surface,
    fix_mode: fix_mode,
});
