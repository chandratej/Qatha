let meta = #{
    name: "katha-feature-decision",
    description: "Unified Feature Decision Workflow — scorecard + blind-spot + council check (Part 1.4 / 4.1)",
    when_to_use: "Any feature/initiative above ~1 week of effort or touching App Store, RBI, security, moderation",
    phases: [
        #{ title: "Research", detail: "factual inputs only" },
        #{ title: "Score", detail: "founder-style scorecard draft" },
        #{ title: "Log", detail: "write decision log artifact" },
    ],
};

let research_schema = #{
    "type": "object",
    "required": ["facts", "blind_spots", "risks"],
    "properties": #{
        "facts": #{ "type": "array", "maxItems": 12, "items": #{ "type": "string" } },
        "blind_spots": #{ "type": "array", "maxItems": 6, "items": #{ "type": "string" } },
        "risks": #{ "type": "array", "maxItems": 6, "items": #{ "type": "string" } },
        "competitors": #{ "type": "array", "maxItems": 6, "items": #{ "type": "string" } },
    },
};

let score_schema = #{
    "type": "object",
    "required": ["quick_filter", "scores", "total", "recommendation", "kill_criteria"],
    "properties": #{
        "quick_filter": #{ "type": "string" },
        "scores": #{ "type": "object" },
        "total": #{ "type": "number" },
        "recommendation": #{ "type": "string" },
        "kill_criteria": #{ "type": "string" },
        "councils": #{ "type": "array", "maxItems": 5, "items": #{ "type": "string" } },
        "stress_test_copycat": #{ "type": "boolean" },
    },
};

let feature = if args == () { () } else { args.feature };
if feature == () {
    pause("verification", "Pass args.feature — short name of the initiative to evaluate.");
}

let context = "";
if args != () && args.context != () { context = args.context; }

phase("Research");
log("Gathering factual research inputs for: " + feature);

let rp = "";
rp += "Feature under review: " + feature + ". ";
if context != "" { rp += "Context: " + context + ". "; }
rp += "Read Katha docs if relevant: docs/MVP1_LAUNCH_CHECKLIST.md, packages/shared/brand.ts, ";
rp += "Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md Part 1.4 and 4.1. ";
rp += "Use read_file/grep. Supply FACTUAL inputs only (competitive behavior, regulatory, cost, screen real-estate). ";
rp += "Do NOT assign scorecard numbers yourself as final truth — list facts, blind_spots (App Store/RBI/security/moderation), risks, competitors. ";
rp += "No PII or production data.";

let research = agent(rp, #{
    label: "feature-research",
    capability_mode: "read-only",
    output_schema: research_schema,
});

phase("Score");
log("Drafting combined scorecard (founder assigns final scores offline)");

let sp = "";
sp += "Draft a Unified Feature Decision scorecard for: " + feature + ". ";
sp += "Template from Master Workflow §4.1: 0-2 each, total /18 for: unfair advantage, asymmetric upside, ";
sp += "structural moat (name Power type), cannibalization trap, founder-market fit, contribution margin, ";
sp += "total cost understood, screen real estate fit, cognitive load pass, kill criteria defined, ";
sp += "reversibility, survives 50% revenue drop, not justified by competitor-has-it alone. ";
sp += "Also quick_filter (harder to copy / leave / better at scale), recommendation, kill_criteria, ";
sp += "councils (pick 2-3 of Legal & Trust, Business & Finance, UX & Design, Creator Economy, Engineering), ";
sp += "stress_test_copycat boolean. ";
if research != () && research.success {
    sp += "Use these research facts as inputs only (founder still owns scores). ";
}
sp += "Label scores as DRAFT for founder review. No production data.";

let score = agent(sp, #{
    label: "feature-score-draft",
    capability_mode: "read-only",
    output_schema: score_schema,
});

phase("Log");

let report = "# Feature Decision Log\n\n";
report += "**Date:** (fill)\n";
report += "**Feature/initiative:** " + feature + "\n\n";

if score != () && score.success {
    report += "**Quick Filter (draft):** " + score.output.quick_filter + "\n\n";
    report += "**Combined score (draft):** " + score.output.total.to_string() + " / 18\n\n";
    report += "**Recommendation (draft):** " + score.output.recommendation + "\n\n";
    report += "**Kill criteria:** " + score.output.kill_criteria + "\n\n";
    if score.output.stress_test_copycat != () {
        report += "**Survives 10x-funded copycat (draft):** " + score.output.stress_test_copycat.to_string() + "\n\n";
    }
} else {
    report += "_Score agent failed — founder fills template manually from §4.1._\n\n";
}

report += "## Research facts\n\n";
if research != () && research.success && research.output.facts != () {
    for f in research.output.facts { report += "- " + f + "\n"; }
} else {
    report += "- (none)\n";
}

report += "\n## Blind-spots\n\n";
if research != () && research.success && research.output.blind_spots != () {
    for b in research.output.blind_spots { report += "- " + b + "\n"; }
} else {
    report += "- (none flagged)\n";
}

report += "\n## Risks\n\n";
if research != () && research.success && research.output.risks != () {
    for b in research.output.risks { report += "- " + b + "\n"; }
}

report += "\n## Founder actions\n\n";
report += "1. Assign final 0-2 scores yourself (do not accept draft as final).\n";
report += "2. Consult 2-3 relevant councils only.\n";
report += "3. If total is weak or blind-spot risk is high — do not build yet.\n";
report += "4. Log owner + review date.\n";
report += "\nSource: Katha_Master_Workflow_Implementation_Prompt.md §1.4 / §4.1\n";

let path = write_scratch_file("feature-decision-log.md", report);
complete(#{
    summary: "Draft decision log for " + feature,
    path: path,
    feature: feature,
});
