"""CRUD operations for arbitrage opportunities and execution results."""
from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select

from tyr.core.models import ArbitrageOpportunity, ExecutionResult, ExecutionStatus
from tyr.storage.database import get_session
from tyr.storage.models_db import ExecutionRecord, OpportunityRecord


async def save_opportunity(opp: ArbitrageOpportunity) -> None:
    async with get_session() as session:
        record = OpportunityRecord(
            id=opp.id,
            arb_type=opp.arb_type.value,
            detected_at=opp.detected_at,
            status=opp.status.value,
            leg_a_platform=opp.leg_a_platform.value,
            leg_a_market_id=opp.leg_a_market_id,
            leg_a_side=opp.leg_a_side.value,
            leg_a_ask_price=float(opp.leg_a_ask_price),
            leg_a_size=float(opp.leg_a_size),
            leg_a_label=opp.leg_a_label,
            leg_b_platform=opp.leg_b_platform.value,
            leg_b_market_id=opp.leg_b_market_id,
            leg_b_side=opp.leg_b_side.value,
            leg_b_ask_price=float(opp.leg_b_ask_price),
            leg_b_size=float(opp.leg_b_size),
            leg_b_label=opp.leg_b_label,
            gross_profit=float(opp.gross_profit),
            total_fees=float(opp.total_fees),
            net_profit=float(opp.net_profit),
            net_profit_pct=float(opp.net_profit_pct),
            execution_id=opp.execution_id,
        )
        session.add(record)
        await session.commit()


async def update_opportunity_status(opp_id: str, status: ExecutionStatus) -> None:
    async with get_session() as session:
        result = await session.execute(
            select(OpportunityRecord).where(OpportunityRecord.id == opp_id)
        )
        record = result.scalar_one_or_none()
        if record:
            record.status = status.value
            await session.commit()


async def save_execution(result: ExecutionResult) -> None:
    async with get_session() as session:
        record = ExecutionRecord(
            id=result.opportunity_id + "_exec",
            opportunity_id=result.opportunity_id,
            status=result.status.value,
            executed_at=result.executed_at,
            leg_a_order_id=result.leg_a_order_id,
            leg_b_order_id=result.leg_b_order_id,
            actual_fill_a=float(result.actual_fill_a) if result.actual_fill_a else None,
            actual_fill_b=float(result.actual_fill_b) if result.actual_fill_b else None,
            actual_profit=float(result.actual_profit) if result.actual_profit else None,
            error=result.error,
        )
        session.add(record)
        await session.commit()


async def get_recent_opportunities(limit: int = 50) -> list[OpportunityRecord]:
    async with get_session() as session:
        result = await session.execute(
            select(OpportunityRecord)
            .order_by(OpportunityRecord.detected_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
