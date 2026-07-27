let meta = #{
    name: "katha-weekly-triage",
    description: "Founder weekly 10-15m triage router (Part 1.1 of Master Workflow)",
    when_to_use: "Start of each week — route to threshold, monthly ops, feature decision, legal, research, or product time",
    phases: [
        #{ title: "Triage", detail: "apply six-question router in order" },
        #{ title: "Brief", detail: "write this week's action brief" },
    ],
};

let route_schema = #{
    "type": "object",
    "required": ["route", "reason", "next_actions", "owner"],
    "properties": #{
        "route": #{ "type": "string" },
        "reason": #{ "type": "string" },
        "next_actions": #{
            "type": "array",
            "maxItems": 8,
            "items": #{ "type": "string" },
        },
        "owner": #{ "type": "string" },
        "workflow_hint": #{ "type": "string" },
    },
};

// Optional human signals via args (first match wins per Part 1.1)
// args.threshold_event | args.month_or_quarter_start | args.feature_over_one_week
// args.legal_doc_need | args.research_question | args.notes

let threshold = false;
let month_start = false;
let feature_big = false;
let legal_need = false;
let research_q = false;
let notes = "";

if args != () {
    if args.threshold_event == true { threshold = true; }
    if args.month_or_quarter_start == true { month_start = true; }
    if args.feature_over_one_week == true { feature_big = true; }
    if args.legal_doc_need == true { legal_need = true; }
    if args.research_question != () && args.research_question != "" {
        research_q = true;
        notes = args.research_question;
    }
    if args.notes != () { notes = args.notes; }
}

phase("Triage");
log("Running Part 1.1 six-question weekly triage router");

let prompt = "";
prompt += "You are Katha's weekly triage router (Master Workflow Part 1.1). ";
prompt += "Read if present: Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md, ";
prompt += "docs/MVP1_LAUNCH_CHECKLIST.md, docs/decisions/DEC-030_format_spec_v1_monetization_tiers.md. ";
prompt += "Use read_file/grep. Apply the six questions IN ORDER; first match wins. ";
prompt += "Signals provided: threshold_event=" + threshold.to_string();
prompt += " month_or_quarter_start=" + month_start.to_string();
prompt += " feature_over_one_week=" + feature_big.to_string();
prompt += " legal_doc_need=" + legal_need.to_string();
prompt += " research_question=" + research_q.to_string() + ". ";
if notes != "" { prompt += "Extra notes: " + notes + ". "; }
prompt += "Pick exactly one route among: ";
prompt += "threshold_part_a, monthly_part_b, feature_decision, legal_draft, research_block, product_engineering_time. ";
prompt += "Return route, reason (cite which question fired), next_actions (concrete, owner-named), owner, workflow_hint ";
prompt += "(name of a Grok workflow if any: katha-monthly-foundations, katha-feature-decision, katha-ops-verification, katha-identity-spoof-verify). ";
prompt += "Do not invent new frameworks. Prefer product_engineering_time when nothing fires.";

let r = agent(prompt, #{
    label: "weekly-router",
    capability_mode: "read-only",
    output_schema: route_schema,
});

// Deterministic fallback if agent fails — first-match on args
let route = "product_engineering_time";
let reason = "No higher-priority signal; default to protected product/engineering time.";
let next_actions = ["Protect maker time this week", "Only break for true threshold or legal needs"];
let owner = "Founder";
let workflow_hint = "";

if r != () && r.success && r.output.route != () {
    route = r.output.route;
    reason = r.output.reason;
    owner = r.output.owner;
    if r.output.workflow_hint != () { workflow_hint = r.output.workflow_hint; }
    if r.output.next_actions != () {
        next_actions = [];
        for a in r.output.next_actions { next_actions.push(a); }
    }
} else {
    // Script-enforced first-match (Part 1.1) when agent unavailable
    if threshold {
        route = "threshold_part_a";
        reason = "Q1: open one-time threshold event.";
        next_actions = [
            "Prioritize counsel/Agreement/RBI/grievance naming over features",
            "Run /katha-ops-verification and /katha-identity-spoof-verify if eng bandwidth",
        ];
        owner = "Founder";
        workflow_hint = "katha-ops-verification";
    } else if month_start {
        route = "monthly_part_b";
        reason = "Q2: month-start or quarter-start.";
        next_actions = ["Run monthly foundations + security + vendor register (~1h)"];
        owner = "Founder";
        workflow_hint = "katha-monthly-foundations";
    } else if feature_big {
        route = "feature_decision";
        reason = "Q3: feature/initiative above ~1 week or blind-spot area.";
        next_actions = ["Run Unified Feature Decision Workflow before any building"];
        owner = "Founder";
        workflow_hint = "katha-feature-decision";
    } else if legal_need {
        route = "legal_draft";
        reason = "Q4: legal/compliance document need.";
        next_actions = ["Grok/Claude drafts; human/lawyer signs off before ship — no override"];
        owner = "Founder + counsel";
        workflow_hint = "";
    } else if research_q {
        route = "research_block";
        reason = "Q5: open-ended research/market question.";
        next_actions = ["Use capped weekly Grok research block; if cap spent, wait"];
        owner = "Founder";
        workflow_hint = "";
    }
}

phase("Brief");

let report = "# Katha weekly triage brief\n\n";
report += "**Route:** `" + route + "`\n\n";
report += "**Reason:** " + reason + "\n\n";
report += "**Owner:** " + owner + "\n\n";
if workflow_hint != "" {
    report += "**Suggested workflow:** `/" + workflow_hint + "`\n\n";
}
report += "## Next actions\n\n";
for a in next_actions {
    report += "- " + a + "\n";
}
report += "\n## Router rules (fixed order)\n\n";
report += "1. Threshold event → Part A\n";
report += "2. Month/quarter start → Part B monthly\n";
report += "3. Big feature / blind-spot → feature decision\n";
report += "4. Legal doc → draft + human sign-off\n";
report += "5. Research question → capped research block\n";
report += "6. Else → product/engineering time\n";
report += "\nSource: Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md Part 1.1\n";

let path = write_scratch_file("weekly-triage-brief.md", report);
complete(#{
    summary: "Routed to " + route,
    route: route,
    owner: owner,
    workflow_hint: workflow_hint,
    path: path,
});
