#!/usr/bin/env python3
"""Bootstrap market data from Polymarket and Kalshi.

Fetches all active markets from both platforms and saves them to
data/market_cache/ as JSON files for use by the market registry.

Usage:
    python scripts/bootstrap_markets.py
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

# Make sure tyr package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from tyr.core.config import get_config
from tyr.core.logging import get_logger, setup_logging
from tyr.feeds.kalshi_rest import KalshiRestFeed
from tyr.feeds.polymarket_rest import PolymarketRestClient, parse_market_info

logger = get_logger(__name__)


async def bootstrap_polymarket(cache_dir: Path, page_size: int) -> int:
    client = PolymarketRestClient(page_size=page_size)
    try:
        logger.info("Fetching Polymarket markets...")
        markets = await client.get_all_markets(active_only=True)

        output_path = cache_dir / "polymarket_markets.json"
        output_path.write_text(json.dumps(markets, indent=2))
        logger.info("Saved %d Polymarket markets to %s", len(markets), output_path)
        return len(markets)
    finally:
        await client.close()


async def bootstrap_kalshi(cache_dir: Path) -> int:
    # KalshiRestFeed uses an httpx client internally
    import asyncio

    queue: asyncio.Queue = asyncio.Queue()
    feed = KalshiRestFeed(queue)
    try:
        logger.info("Fetching Kalshi markets...")
        markets = await feed.get_all_markets()

        output_path = cache_dir / "kalshi_markets.json"
        output_path.write_text(json.dumps(markets, indent=2))
        logger.info("Saved %d Kalshi markets to %s", len(markets), output_path)
        return len(markets)
    finally:
        await feed.stop()


async def main() -> None:
    setup_logging("INFO")
    config = get_config()
    cache_dir = Path(config.market_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    poly_count, kalshi_count = await asyncio.gather(
        bootstrap_polymarket(cache_dir, config.polymarket_page_size),
        bootstrap_kalshi(cache_dir),
    )

    print(f"\nBootstrap complete:")
    print(f"  Polymarket: {poly_count} markets → {cache_dir / 'polymarket_markets.json'}")
    print(f"  Kalshi:     {kalshi_count} markets → {cache_dir / 'kalshi_markets.json'}")


if __name__ == "__main__":
    asyncio.run(main())
