"""Rich-based live console display for the bot."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from rich.console import Console
from rich.table import Table
from rich import box

console = Console()


def print_startup_banner(dry_run: bool) -> None:
    mode = "[bold yellow]DRY RUN[/bold yellow]" if dry_run else "[bold red]LIVE[/bold red]"
    console.print(f"\n[bold cyan]Tyr Arbitrage Bot[/bold cyan] — Mode: {mode}\n")


def print_opportunity(opp_id: str, arb_type: str, net_profit_pct: Decimal,
                      net_profit: Decimal, leg_a_label: str, leg_b_label: str,
                      status: str) -> None:
    color = "green" if float(net_profit) > 0 else "red"
    console.print(
        f"[dim]{datetime.now().strftime('%H:%M:%S')}[/dim] "
        f"[cyan]{arb_type.upper()}[/cyan] "
        f"[{color}]+{float(net_profit_pct)*100:.2f}%  ${float(net_profit):.4f}[/{color}]  "
        f"{leg_a_label} ↔ {leg_b_label}  "
        f"[dim]{status}[/dim]"
    )


def print_stats(detected: int, dry_run: int, filled: int, failed: int) -> None:
    table = Table(box=box.SIMPLE, show_header=True, header_style="bold")
    table.add_column("Detected")
    table.add_column("Dry Run")
    table.add_column("Filled")
    table.add_column("Failed")
    table.add_row(str(detected), str(dry_run), str(filled), str(failed))
    console.print(table)
