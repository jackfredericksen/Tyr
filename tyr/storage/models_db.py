"""SQLAlchemy ORM models for persistent storage."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class OpportunityRecord(Base):
    __tablename__ = "opportunities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    arb_type: Mapped[str] = mapped_column(String(20))
    detected_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20))

    leg_a_platform: Mapped[str] = mapped_column(String(20))
    leg_a_market_id: Mapped[str] = mapped_column(String(200))
    leg_a_side: Mapped[str] = mapped_column(String(5))
    leg_a_ask_price: Mapped[float] = mapped_column(Float)
    leg_a_size: Mapped[float] = mapped_column(Float)
    leg_a_label: Mapped[str] = mapped_column(Text, default="")

    leg_b_platform: Mapped[str] = mapped_column(String(20))
    leg_b_market_id: Mapped[str] = mapped_column(String(200))
    leg_b_side: Mapped[str] = mapped_column(String(5))
    leg_b_ask_price: Mapped[float] = mapped_column(Float)
    leg_b_size: Mapped[float] = mapped_column(Float)
    leg_b_label: Mapped[str] = mapped_column(Text, default="")

    gross_profit: Mapped[float] = mapped_column(Float)
    total_fees: Mapped[float] = mapped_column(Float)
    net_profit: Mapped[float] = mapped_column(Float)
    net_profit_pct: Mapped[float] = mapped_column(Float)

    execution_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class ExecutionRecord(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    opportunity_id: Mapped[str] = mapped_column(String(36))
    status: Mapped[str] = mapped_column(String(20))
    executed_at: Mapped[datetime] = mapped_column(DateTime)

    leg_a_order_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    leg_b_order_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    actual_fill_a: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_fill_b: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class MarketMatchRecord(Base):
    __tablename__ = "market_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kalshi_ticker: Mapped[str] = mapped_column(String(200), index=True)
    poly_yes_token_id: Mapped[str] = mapped_column(String(200))
    poly_no_token_id: Mapped[str] = mapped_column(String(200), default="")
    match_score: Mapped[float] = mapped_column(Float)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
