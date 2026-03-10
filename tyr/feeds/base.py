from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod


class DataFeed(ABC):
    """Base class for all market data feeds."""

    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self._running = False

    @abstractmethod
    async def run(self) -> None:
        """Start the feed and push Orderbook objects to self.queue."""

    async def stop(self) -> None:
        self._running = False
