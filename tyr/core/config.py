from __future__ import annotations

from pathlib import Path
from typing import Optional

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PolymarketCreds(BaseSettings):
    private_key: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    api_passphrase: Optional[str] = None
    chain_id: int = 137  # Polygon mainnet

    model_config = SettingsConfigDict(env_prefix="POLYMARKET_", extra="ignore")


class KalshiCreds(BaseSettings):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None

    model_config = SettingsConfigDict(env_prefix="KALSHI_", extra="ignore")


class ArbitrageThresholds(BaseSettings):
    min_net_profit_pct: float = 0.005    # 0.5%
    max_position_usdc: float = 100.0
    max_daily_loss_usdc: float = 500.0
    max_open_positions: int = 5
    opportunity_ttl_secs: float = 2.0
    dry_run: bool = True                 # Safe default

    model_config = SettingsConfigDict(env_prefix="THRESHOLDS__", extra="ignore")


class FeeConfig(BaseSettings):
    polymarket_taker_bps: int = 200      # 2%
    polymarket_maker_bps: int = 0
    kalshi_taker_fee_pct: float = 0.07   # ~7% of profit
    slippage_buffer_pct: float = 0.005   # 0.5%

    model_config = SettingsConfigDict(env_prefix="FEES__", extra="ignore")


class TyrConfig(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"
    log_file: str = "data/logs/tyr.log"
    db_path: str = "data/db/tyr.db"
    market_cache_dir: str = "data/market_cache"

    polymarket: PolymarketCreds = Field(default_factory=PolymarketCreds)
    kalshi: KalshiCreds = Field(default_factory=KalshiCreds)
    thresholds: ArbitrageThresholds = Field(default_factory=ArbitrageThresholds)
    fees: FeeConfig = Field(default_factory=FeeConfig)

    enable_spread_scanner: bool = True
    enable_cross_market_scanner: bool = True
    enable_cross_platform_scanner: bool = True

    fuzzy_match_threshold: float = 85.0
    max_market_age_days: int = 90
    kalshi_poll_interval: float = 5.0
    polymarket_page_size: int = 500

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @classmethod
    def load(cls, yaml_path: str = "config/default.yaml") -> "TyrConfig":
        path = Path(yaml_path)
        yaml_data: dict = {}
        if path.exists():
            yaml_data = yaml.safe_load(path.read_text()) or {}
        # Flatten nested keys for pydantic (thresholds, fees stay as nested)
        return cls(**yaml_data)


_config: Optional[TyrConfig] = None


def get_config() -> TyrConfig:
    global _config
    if _config is None:
        _config = TyrConfig.load()
    return _config


def set_config(cfg: TyrConfig) -> None:
    """Override the global config (useful for tests)."""
    global _config
    _config = cfg
