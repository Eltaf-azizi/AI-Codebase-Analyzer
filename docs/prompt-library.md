# Prompt Library

## Retrieval Intent Prompt
Classify user query intent into: architecture, data flow, auth, deployment, bug tracing.

## Grounded Answer Prompt
Answer only from provided context. Include file path references. Say when context is insufficient.

## Analysis Prompt
Return JSON:
- project_summary
- architecture_summary
- dependency_insights
- risks
- confidence

## Debug Prompt
Return:
- root_cause
- evidence
- suggested_fixes
- tradeoffs
