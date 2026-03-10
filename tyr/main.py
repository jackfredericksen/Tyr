"""Tyr — Polymarket arbitrage bot entry point.

Phase 1: Data feed and display only (no scanning/execution yet).
Run: python -m tyr.main
"""
from __future__ import annotations

import asyncio
import signal
import sys
from pathlib import Path

from tyr.core.config import get_config
from tyr.core.logging import get_logger, setup_logging
from tyr.core.models import Orderbook
from tyr.feeds.feed_manager import FeedManager
from tyr.storage.database import close_db, init_db
from tyr.utils.console import print_startup_banner

logger = get_logger(__name__)

# Bootstrapped market data paths
CACHE_DIR = Path("data/market_cache")
POLY_CACHE = CACHE_DIR / "polymarket_markets.json"
KALSHI_CACHE = CACHE_DIR / "kalshi_markets.json"


def _load_token_ids() -> list[str]:
    """Load Polymarket YES token IDs from cached market data."""
    if not POLY_CACHE.exists():
        logger.warning(
            "No Polymarket market cache found at %s. "
            "Run: python scripts/bootstrap_markets.py",
            POLY_CACHE,
        )
        return []

    import json
    markets = json.loads(POLY_CACHE.read_text())
    token_ids: list[str] = []
    for m in markets:
        for token in m.get("tokens", []):
            if token.get("outcome", "").lower() == "yes":
                token_ids.append(token["token_id"])
    logger.info("Loaded %d YES token IDs from cache", len(token_ids))
    return token_ids


def _load_kalshi_tickers() -> list[str]:
    """Load Kalshi tickers from cached market data."""
    if not KALSHI_CACHE.exists():
        logger.warning(
            "No Kalshi market cache found at %s. "
            "Run: python scripts/bootstrap_markets.py",
            KALSHI_CACHE,
        )
        return []

    import json
    markets = json.loads(KALSHI_CACHE.read_text())
    tickers = [m["ticker"] for m in markets if m.get("ticker")]
    logger.info("Loaded %d Kalshi tickers from cache", len(tickers))
    return tickers


async def price_display_loop(feed_manager: FeedManager) -> None:
    """Phase 1: Print incoming orderbook updates to console."""
    count = 0
    async for ob in feed_manager:
        count += 1
        best_yes = ob.best_yes_ask
        best_no = ob.best_no_ask
        if best_yes and count % 100 == 0:
            logger.info(
                "[%s] %s | YES ask: %.3f | NO ask: %.3f",
                ob.platform.value,
                ob.market_id[:20],
                float(best_yes.price),
                float(best_no.price) if best_no else 0.0,
            )


async def run() -> None:
    config = get_config()
    setup_logging(config.log_level, config.log_file)

    print_startup_banner(dry_run=config.thresholds.dry_run)

    await init_db(config.db_path)

    poly_token_ids = _load_token_ids()
    kalshi_tickers = _load_kalshi_tickers()

    if not poly_token_ids and not kalshi_tickers:
        logger.warning(
            "No market data loaded. Run bootstrap first:\n"
            "  python scripts/bootstrap_markets.py"
        )

    feed_manager = FeedManager(config)
    await feed_manager.start(poly_token_ids, kalshi_tickers)

    logger.info("Bot running. Press Ctrl+C to stop.")

    loop = asyncio.get_event_loop()
    stop_event = asyncio.Event()

    def _handle_signal():
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _handle_signal)

    try:
        display_task = asyncio.create_task(price_display_loop(feed_manager))
        await stop_event.wait()
    finally:
        display_task.cancel()
        await feed_manager.stop()
        await close_db()
        logger.info("Tyr shut down cleanly.")


def cli() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    cli()
