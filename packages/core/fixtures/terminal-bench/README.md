# Terminal-Bench

Terminal-Bench is a benchmark for evaluating AI agents (or LLMs as agents) on
realistic terminal-based tasks. It is used to measure the ability of AI agents
to complete tasks using a terminal.

This is a continuous benchmark — tasks are added and updated over time and
each tagged release is the snapshot used for leaderboards. The Harbor Hub
leaderboards are based on these tagged releases.

## Usage

Run via Harbor:

```bash
harbor run -d terminal-bench/terminal-bench@latest -a <agent> -m <model>
```

Oracle solutions should be run 5x to verify the sandboxed environment works
correctly before evaluation:

```bash
harbor run -d terminal-bench/terminal-bench -k 5
```

## Leaders

Laude Institute, Ryan Marten, Alex Shaw, Andy Konwinski, Ludwig Schmidt.

Terminal-Bench is hosted by Harbor and Laude Institute.
