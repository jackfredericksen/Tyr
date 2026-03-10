"""Polymarket CLOB REST client for bootstrapping and fallback data.

Public endpoints require no authentication.
"""
from __future__ import annotations

import time
from decimal import Decimal
from typing import Optional

import httpx

from tyr.core.logging import get_logger
from tyr.core.models import MarketInfo, Orderbook, Platform, PriceLevel

logger = get_logger(__name__)

CLOB_BASE = "https://clob.polymarket.com"


class PolymarketRestClient:
    """Thin async wrapper around the Polymarket CLOB REST API."""

    def __init__(self, page_size: int = 500):
        self.page_size = page_size
        self._client = httpx.AsyncClient(
            base_url=CLOB_BASE,
            timeout=15.0,
            headers={"Accept": "application/json"},
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def get_markets(
        self,
        next_cursor: Optional[str] = None,
        active_only: bool = True,
    ) -> tuple[list[dict], Optional[str]]:
        """Fetch one page of markets. Returns (markets, next_cursor)."""
        params: dict = {"limit": self.page_size}
        if next_cursor:
            params["next_cursor"] = next_cursor
        if active_only:
            params["active"] = "true"

        resp = await self._client.get("/markets", params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", []), data.get("next_cursor")

    async def get_all_markets(self, active_only: bool = True) -> list[dict]:
        """Paginate through all markets and return them."""
        markets: list[dict] = []
        cursor: Optional[str] = None

        while True:
            page, cursor = await self.get_markets(cursor, active_only=active_only)
            markets.extend(page)
            logger.debug("Fetched %d markets (total so far: %d)", len(page), len(markets))
            if not cursor or cursor == "LTE=":
                break

        logger.info("Fetched %d total Polymarket markets", len(markets))
        return markets

    async def get_orderbook(self, token_id: str) -> Optional[Orderbook]:
        """Fetch current orderbook for a token (YES or NO side)."""
        try:
            resp = await self._client.get("/book", params={"token_id": token_id})
            resp.raise_for_status()
            data = resp.json()
            return _parse_orderbook(data, token_id)
        except Exception as exc:
            logger.warning("Failed to fetch orderbook for %s: %s", token_id, exc)
            return None

    async def get_market(self, condition_id: str) -> Optional[dict]:
        """Fetch a single market by condition_id."""
        try:
            resp = await self._client.get(f"/markets/{condition_id}")
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.warning("Failed to fetch market %s: %s", condition_id, exc)
            return None


def parse_market_info(raw: dict) -> Optional[MarketInfo]:
    """Convert a raw Polymarket market dict into a MarketInfo."""
    try:
        # Polymarket markets have multiple tokens (YES token, NO token)
        tokens = raw.get("tokens", [])
        # Use the first token's token_id as the market_id
        market_id = tokens[0]["token_id"] if tokens else raw.get("condition_id", "")

        from datetime import datetime

        end_str = raw.get("end_date_iso") or raw.get("game_start_time")
        end_date: Optional[datetime] = None
        if end_str:
            try:
                end_date = datetime.fromisoformat(end_str.rstrip("Z"))
            except ValueError:
                pass

        return MarketInfo(
            platform=Platform.POLYMARKET,
            market_id=market_id,
            event_id=raw.get("condition_id", ""),
            question=raw.get("question", ""),
            description=raw.get("description", ""),
            end_date=end_date,
            active=raw.get("active", False),
            extra=raw,
        )
    except Exception as exc:
        logger.debug("Failed to parse market info: %s", exc)
        return None


def _parse_orderbook(data: dict, token_id: str) -> Orderbook:
    """Parse a CLOB /book response into an Orderbook."""

    def levels(side_list: list[dict]) -> list[PriceLevel]:
        return [
            PriceLevel(
                price=Decimal(str(item["price"])),
                size=Decimal(str(item["size"])),
            )
            for item in side_list
            if "price" in item and "size" in item
        ]

    # The /book endpoint returns bids/asks for one side (YES or NO token)
    # We model it as if we have the yes side; the scanner will pair tokens.
    bids = levels(data.get("bids", []))
    asks = levels(data.get("asks", []))

    return Orderbook(
        platform=Platform.POLYMARKET,
        market_id=token_id,
        event_id=data.get("market", token_id),
        yes_bids=bids,
        yes_asks=asks,
        no_bids=[],
        no_asks=[],
        timestamp=time.time(),
        raw=data,
    )
