# Stub of automationbench/runner.py for fixture identification.
# Real source: https://raw.githubusercontent.com/zapier/AutomationBench/main/automationbench/runner.py
#
# Key facts captured in research/15-06:
#   - toolset options: api | zapier | limited_zapier
#   - api mode: search (BM25 on API schemas, top 5) + execute (method/URL/body like curl/fetch)
#   - default max_steps=50; rollouts_per_example=1
