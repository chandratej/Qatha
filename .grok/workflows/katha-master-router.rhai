let meta = #{
    name: "katha-master-router",
    description: "Top-level router for Katha Master Workflow — picks weekly triage, feature decision, ops, identity, or data safety",
    when_to_use: "Entry point when unsure which Master Workflow branch to run",
    phases: [
        #{ title: "Route", detail: "select branch from args or defaults" },
        #{ title: "Brief", detail: "emit next-command brief" },
    ],
};

// args.intent: weekly | monthly | feature | identity | data_safety | ops | threshold
// args.feature: required when intent=feature

let intent = "weekly";
if args != () && args.intent != () {
    intent = args.intent;
}

phase("Route");
log("Master router intent=" + intent);

let workflow_name = "katha-weekly-triage";
let reason = "Default weekly triage router.";
let sample_args = "{}";

if intent == "weekly" {
    workflow_name = "katha-weekly-triage";
    reason = "Part 1.1 weekly triage.";
    sample_args = "{ \"threshold_event\": false, \"month_or_quarter_start\": false }";
} else if intent == "monthly" {
    workflow_name = "katha-monthly-foundations";
    reason = "Part 1.3 monthly foundations + security.";
    sample_args = "{}";
} else if intent == "feature" {
    workflow_name = "katha-feature-decision";
    reason = "Part 1.4 unified feature decision.";
    sample_args = "{ \"feature\": \"your-initiative-name\" }";
} else if intent == "identity" {
    workflow_name = "katha-identity-spoof-verify";
    reason = "Part 2.1 identity-spoof verification.";
    sample_args = "{ \"fix_mode\": \"fix\" }";
} else if intent == "data_safety" {
    workflow_name = "katha-external-data-safety";
    reason = "Part 2.2 / Part 3 external LLM data safety.";
    sample_args = "{ \"fix_mode\": \"fix\" }";
} else if intent == "ops" {
    workflow_name = "katha-ops-verification";
    reason = "Part 2.3 ops verification.";
    sample_args = "{}";
} else if intent == "threshold" {
    workflow_name = "katha-weekly-triage";
    reason = "Threshold week — force Part A priority via weekly triage.";
    sample_args = "{ \"threshold_event\": true }";
} else if intent == "mvp1_audit" {
    workflow_name = "mvp1-product-workflow-audit";
    reason = "MVP1 product path audit (engineering).";
    sample_args = "{ \"fix_mode\": \"fix\" }";
}

phase("Brief");

let report = "# Katha Master Workflow — route brief\n\n";
report += "**Intent:** `" + intent + "`\n\n";
report += "**Reason:** " + reason + "\n\n";
report += "**Run next:**\n\n";
report += "```\n/" + workflow_name + "\n```\n\n";
report += "With args:\n\n```json\n" + sample_args + "\n```\n\n";
report += "## Catalog\n\n";
report += "| Intent | Workflow |\n|---|---|\n";
report += "| weekly | katha-weekly-triage |\n";
report += "| monthly | katha-monthly-foundations |\n";
report += "| feature | katha-feature-decision |\n";
report += "| identity | katha-identity-spoof-verify |\n";
report += "| data_safety | katha-external-data-safety |\n";
report += "| ops | katha-ops-verification |\n";
report += "| threshold | katha-weekly-triage (threshold_event=true) |\n";
report += "| mvp1_audit | mvp1-product-workflow-audit |\n\n";
report += "Source: Worklog/27_JUL_2026/Katha_Master_Workflow_Implementation_Prompt.md\n";

let path = write_scratch_file("master-router-brief.md", report);
complete(#{
    summary: "Route to /" + workflow_name,
    workflow: workflow_name,
    intent: intent,
    path: path,
});
