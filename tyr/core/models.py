from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional


class Platform(str, Enum):
    POLYMARKET = "polymarket"
    KALSHI = "kalshi"


class ArbitrageType(str, Enum):
    SPREAD = "spread"               # YES + NO ask < 1 within one market
    CROSS_MARKET = "cross_market"   # Same event, two Polymarket markets
    CROSS_PLATFORM = "cross_platform"  # Polymarket vs Kalshi


class Side(str, Enum):
    YES = "yes"
    NO = "no"


class ExecutionStatus(str, Enum):
    DETECTED = "detected"
    VALIDATING = "validating"
    DRY_RUN = "dry_run"
    EXECUTING = "executing"
    FILLED = "filled"
    PARTIAL = "partial"
    FAILED = "failed"
    EXPIRED = "expired"


@dataclass
class PriceLevel:
    price: Decimal
    size: Decimal


@dataclass
class Orderbook:
    """Normalized orderbook from either platform.

    Prices are always in [0.0, 1.0] (fraction of $1 payout).
    Kalshi cent-prices must be converted before creating this object.
    """
    platform: Platform
    market_id: str      # Polymarket token_id or Kalshi ticker
    event_id: str       # Grouping key (Polymarket event slug or Kalshi event_ticker)
    yes_bids: list[PriceLevel]
    yes_asks: list[PriceLevel]
    no_bids: list[PriceLevel]
    no_asks: list[PriceLevel]
    timestamp: float    # Unix epoch seconds
    raw: dict = field(default_factory=dict, repr=False)

    @property
    def best_yes_ask(self) -> Optional[PriceLevel]:
        return min(self.yes_asks, key=lambda p: p.price) if self.yes_asks else None

    @property
    def best_no_ask(self) -> Optional[PriceLevel]:
        return min(self.no_asks, key=lambda p: p.price) if self.no_asks else None

    @property
    def best_yes_bid(self) -> Optional[PriceLevel]:
        return max(self.yes_bids, key=lambda p: p.price) if self.yes_bids else None

    @property
    def best_no_bid(self) -> Optional[PriceLevel]:
        return max(self.no_bids, key=lambda p: p.price) if self.no_bids else None


@dataclass
class MarketInfo:
    """Static metadata about a market (fetched once, cached)."""
    platform: Platform
    market_id: str
    event_id: str
    question: str
    description: str
    end_date: Optional[datetime]
    active: bool
    volume_usdc: Decimal = Decimal("0")
    extra: dict = field(default_factory=dict, repr=False)


@dataclass
class ArbitrageOpportunity:
    """A fully-evaluated, not-yet-executed arbitrage opportunity."""
    id: str                      # uuid4
    arb_type: ArbitrageType
    detected_at: datetime

    # Leg A
    leg_a_platform: Platform
    leg_a_market_id: str
    leg_a_side: Side
    leg_a_ask_price: Decimal
    leg_a_size: Decimal          # USDC to deploy

    # Leg B
    leg_b_platform: Platform
    leg_b_market_id: str
    leg_b_side: Side
    leg_b_ask_price: Decimal
    leg_b_size: Decimal

    # Economics (all in USDC)
    gross_profit: Decimal
    total_fees: Decimal
    net_profit: Decimal
    net_profit_pct: Decimal      # net_profit / cost_basis

    status: ExecutionStatus = ExecutionStatus.DETECTED
    execution_id: Optional[str] = None

    # Human-readable labels for display
    leg_a_label: str = ""
    leg_b_label: str = ""


@dataclass
class ExecutionResult:
    opportunity_id: str
    status: ExecutionStatus
    leg_a_order_id: Optional[str]
    leg_b_order_id: Optional[str]
    actual_fill_a: Optional[Decimal]
    actual_fill_b: Optional[Decimal]
    actual_profit: Optional[Decimal]
    error: Optional[str]
    executed_at: datetime
