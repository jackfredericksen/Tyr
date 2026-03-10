"""Feed manager — multiplexes all data feeds into a single async queue."""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

from tyr.core.config import TyrConfig
from tyr.core.logging import get_logger
from tyr.core.models import Orderbook
from tyr.feeds.kalshi_rest import KalshiRestFeed
from tyr.feeds.polymarket_ws import PolymarketWSFeed

logger = get_logger(__name__)


class FeedManager:
    """Owns the shared asyncio.Queue and starts all feed tasks."""

    def __init__(self, config: TyrConfig):
        self.config = config
        self.queue: asyncio.Queue[Orderbook] = asyncio.Queue(maxsize=50_000)
        self._tasks: list[asyncio.Task] = []
        self._poly_feed: PolymarketWSFeed | None = None
        self._kalshi_feed: KalshiRestFeed | None = None

    async def start(
        self,
        poly_token_ids: list[str],
        kalshi_tickers: list[str],
    ) -> None:
        """Start all feed tasks."""
        self._poly_feed = PolymarketWSFeed(self.queue, poly_token_ids)
        self._kalshi_feed = KalshiRestFeed(
            self.queue,
            tickers=kalshi_tickers,
            poll_interval=self.config.kalshi_poll_interval,
        )

        self._tasks = [
            asyncio.create_task(self._poly_feed.run(), name="poly_ws"),
            asyncio.create_task(self._kalshi_feed.run(), name="kalshi_rest"),
        ]
        logger.info(
            "FeedManager started: %d Poly tokens, %d Kalshi tickers",
            len(poly_token_ids),
            len(kalshi_tickers),
        )

    async def stop(self) -> None:
        """Cancel all feed tasks gracefully."""
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        if self._kalshi_feed:
            await self._kalshi_feed.stop()
        logger.info("FeedManager stopped")

    async def __aiter__(self) -> AsyncIterator[Orderbook]:
        """Async iterator over incoming orderbook updates."""
        while True:
            yield await self.queue.get()
