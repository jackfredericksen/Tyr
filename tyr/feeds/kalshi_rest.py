"""Kalshi REST feed — polls public market data at a configurable interval.

No authentication required for market prices.
Kalshi prices are integers in cents; we divide by 100 to normalize to [0, 1].
"""
from __future__ import annotations

import asyncio
import time
from decimal import Decimal
from typing import Optional

import httpx

from tyr.core.logging import get_logger
from tyr.core.models import MarketInfo, Orderbook, Platform, PriceLevel
from tyr.feeds.base import DataFeed

logger = get_logger(__name__)

KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2"
_CENTS = Decimal("100")


class KalshiRestFeed(DataFeed):
    """Polls Kalshi REST API and pushes Orderbook updates to the queue."""

    def __init__(
        self,
        queue: asyncio.Queue,
        tickers: Optional[list[str]] = None,
        poll_interval: float = 5.0,
    ):
        super().__init__(queue)
        self.tickers = tickers or []
        self.poll_interval = poll_interval
        self._client = httpx.AsyncClient(
            base_url=KALSHI_BASE,
            timeout=15.0,
            headers={"Accept": "application/json"},
        )

    async def run(self) -> None:
        self._running = True
        logger.info("KalshiRestFeed starting (poll interval %.1fs)", self.poll_interval)
        while self._running:
            try:
                await self._poll_once()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("Kalshi poll error: %s", exc)
            await asyncio.sleep(self.poll_interval)

    async def stop(self) -> None:
        self._running = False
        await self._client.aclose()

    async def _poll_once(self) -> None:
        markets = await self._fetch_markets()
        for m in markets:
            ob = _normalize_market(m)
            if ob is not None:
                await self.queue.put(ob)

    async def _fetch_markets(self) -> list[dict]:
        """Fetch markets — filtered by tickers if provided, else all active."""
        params: dict = {"limit": 1000, "status": "open"}
        if self.tickers:
            params["tickers"] = ",".join(self.tickers)

        try:
            resp = await self._client.get("/markets", params=params)
            resp.raise_for_status()
            return resp.json().get("markets", [])
        except Exception as exc:
            logger.warning("Kalshi /markets fetch failed: %s", exc)
            return []

    async def get_all_markets(self) -> list[dict]:
        """Fetch all open Kalshi markets (for bootstrapping)."""
        all_markets: list[dict] = []
        cursor: Optional[str] = None

        while True:
            params: dict = {"limit": 1000, "status": "open"}
            if cursor:
                params["cursor"] = cursor

            try:
                resp = await self._client.get("/markets", params=params)
                resp.raise_for_status()
                data = resp.json()
                page = data.get("markets", [])
                all_markets.extend(page)
                cursor = data.get("cursor")
                logger.debug("Fetched %d Kalshi markets (total: %d)", len(page), len(all_markets))
                if not cursor or not page:
                    break
            except Exception as exc:
                logger.error("Kalshi bootstrap fetch failed: %s", exc)
                break

        logger.info("Fetched %d total Kalshi markets", len(all_markets))
        return all_markets


def _cents(v: Optional[int]) -> Decimal:
    """Convert Kalshi cent-price to [0, 1] Decimal."""
    if v is None:
        return Decimal("0")
    return Decimal(str(v)) / _CENTS


def _normalize_market(m: dict) -> Optional[Orderbook]:
    """Convert a raw Kalshi market dict into a normalized Orderbook."""
    try:
        ticker = m.get("ticker", "")
        event_ticker = m.get("event_ticker", ticker)

        yes_bid = _cents(m.get("yes_bid"))
        yes_ask = _cents(m.get("yes_ask"))
        no_bid = _cents(m.get("no_bid"))
        no_ask = _cents(m.get("no_ask"))

        # Skip markets with no pricing data
        if yes_ask == 0 and no_ask == 0:
            return None

        # Kalshi doesn't expose size at each level in the REST market list,
        # so we use a nominal placeholder size of 1000 USDC.
        NOMINAL = Decimal("1000")

        return Orderbook(
            platform=Platform.KALSHI,
            market_id=ticker,
            event_id=event_ticker,
            yes_bids=[PriceLevel(yes_bid, NOMINAL)] if yes_bid > 0 else [],
            yes_asks=[PriceLevel(yes_ask, NOMINAL)] if yes_ask > 0 else [],
            no_bids=[PriceLevel(no_bid, NOMINAL)] if no_bid > 0 else [],
            no_asks=[PriceLevel(no_ask, NOMINAL)] if no_ask > 0 else [],
            timestamp=time.time(),
            raw=m,
        )
    except Exception as exc:
        logger.debug("Failed to normalize Kalshi market: %s", exc)
        return None


def parse_kalshi_market_info(raw: dict) -> MarketInfo:
    """Convert raw Kalshi market dict into MarketInfo."""
    from datetime import datetime

    close_str = raw.get("close_time") or raw.get("expiration_time")
    end_date: Optional[datetime] = None
    if close_str:
        try:
            end_date = datetime.fromisoformat(close_str.rstrip("Z"))
        except ValueError:
            pass

    return MarketInfo(
        platform=Platform.KALSHI,
        market_id=raw.get("ticker", ""),
        event_id=raw.get("event_ticker", ""),
        question=raw.get("title", ""),
        description=raw.get("rules_primary", ""),
        end_date=end_date,
        active=raw.get("status") == "open",
        extra=raw,
    )
