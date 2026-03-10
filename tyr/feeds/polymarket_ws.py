"""Polymarket WebSocket feed for real-time orderbook updates.

Connects to wss://ws-subscriptions-clob.polymarket.com/ws/market
and subscribes to the 'book' channel for live price updates.
"""
from __future__ import annotations

import asyncio
import json
import time
from decimal import Decimal
from typing import Optional

import websockets
from websockets.exceptions import ConnectionClosed

from tyr.core.logging import get_logger
from tyr.core.models import Orderbook, Platform, PriceLevel
from tyr.feeds.base import DataFeed

logger = get_logger(__name__)

POLY_WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market"


class PolymarketWSFeed(DataFeed):
    """Real-time Polymarket orderbook feed over WebSocket.

    Maintains a persistent connection with exponential-backoff reconnection.
    Pushes normalized Orderbook objects to the shared queue.
    """

    def __init__(self, queue: asyncio.Queue, token_ids: list[str]):
        super().__init__(queue)
        self.token_ids = token_ids
        self._reconnect_delay = 1.0
        # In-memory book state: token_id → {bids: [...], asks: [...]}
        self._books: dict[str, dict] = {}

    async def run(self) -> None:
        self._running = True
        logger.info("PolymarketWSFeed starting with %d tokens", len(self.token_ids))
        while self._running:
            try:
                await self._connect_and_stream()
                self._reconnect_delay = 1.0
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning(
                    "Polymarket WS error: %s — reconnecting in %.1fs",
                    exc,
                    self._reconnect_delay,
                )
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, 60.0)

    async def _connect_and_stream(self) -> None:
        async with websockets.connect(
            POLY_WS_URL,
            ping_interval=20,
            ping_timeout=30,
        ) as ws:
            logger.info("Polymarket WS connected")

            # Subscribe to orderbook channel for all tokens
            sub = {
                "auth": {},
                "type": "subscribe",
                "channel": "book",
                "markets": self.token_ids,
            }
            await ws.send(json.dumps(sub))

            async for raw in ws:
                if not self._running:
                    break
                try:
                    msg = json.loads(raw)
                    await self._handle_message(msg)
                except Exception as exc:
                    logger.debug("WS message parse error: %s", exc)

    async def _handle_message(self, msg: dict | list) -> None:
        # Polymarket sends either a list of events or a single event dict
        if isinstance(msg, list):
            for event in msg:
                await self._handle_event(event)
        elif isinstance(msg, dict):
            await self._handle_event(msg)

    async def _handle_event(self, event: dict) -> None:
        event_type = event.get("event_type") or event.get("type")

        if event_type == "book":
            # Full book snapshot
            token_id = event.get("asset_id") or event.get("market")
            if not token_id:
                return
            self._books[token_id] = {
                "bids": event.get("bids", []),
                "asks": event.get("asks", []),
            }
            ob = self._build_orderbook(token_id)
            if ob:
                await self.queue.put(ob)

        elif event_type in ("price_change", "tick_size_change"):
            # Incremental update — rebuild from cached book after applying delta
            token_id = event.get("asset_id") or event.get("market")
            if not token_id or token_id not in self._books:
                return
            # Apply side updates
            side = event.get("side", "").lower()
            price = event.get("price")
            size = event.get("size")
            if price is not None and size is not None:
                book = self._books[token_id]
                level_list = book["bids"] if side == "buy" else book["asks"]
                # Update or remove level
                existing = next((l for l in level_list if l.get("price") == price), None)
                if existing:
                    if float(size) == 0:
                        level_list.remove(existing)
                    else:
                        existing["size"] = size
                elif float(size) > 0:
                    level_list.append({"price": price, "size": size})

            ob = self._build_orderbook(token_id)
            if ob:
                await self.queue.put(ob)

    def _build_orderbook(self, token_id: str) -> Optional[Orderbook]:
        book = self._books.get(token_id)
        if not book:
            return None

        def levels(raw_list: list) -> list[PriceLevel]:
            result = []
            for item in raw_list:
                try:
                    if isinstance(item, dict):
                        result.append(PriceLevel(
                            price=Decimal(str(item["price"])),
                            size=Decimal(str(item["size"])),
                        ))
                except (KeyError, Exception):
                    pass
            return result

        bids = levels(book.get("bids", []))
        asks = levels(book.get("asks", []))

        return Orderbook(
            platform=Platform.POLYMARKET,
            market_id=token_id,
            event_id=token_id,  # will be enriched by market_registry
            yes_bids=bids,
            yes_asks=asks,
            no_bids=[],
            no_asks=[],
            timestamp=time.time(),
        )
