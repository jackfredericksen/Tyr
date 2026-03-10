#!/usr/bin/env python3
"""Interactive wizard to derive Polymarket L2 API credentials from a private key.

Usage:
    python scripts/setup_credentials.py

What it does:
  1. Prompts for your Polygon wallet private key (L1)
  2. Calls Polymarket CLOB to derive L2 API credentials (apiKey, secret, passphrase)
  3. Appends them to your .env file

You need py-clob-client installed: pip install py-clob-client
"""
from __future__ import annotations

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def main() -> None:
    print("=== Polymarket Credential Setup ===\n")

    try:
        from py_clob_client.client import ClobClient
        from py_clob_client.constants import POLYGON
    except ImportError:
        print("ERROR: py-clob-client not installed.")
        print("Run: pip install py-clob-client")
        sys.exit(1)

    private_key = getpass.getpass("Enter your Polygon wallet private key (0x...): ").strip()
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    print("\nConnecting to Polymarket CLOB...")
    try:
        client = ClobClient(
            host="https://clob.polymarket.com",
            chain_id=POLYGON,
            key=private_key,
        )
        creds = client.derive_api_key()
    except Exception as exc:
        print(f"ERROR: Failed to derive API key: {exc}")
        print("Make sure your private key is correct and your wallet has been used on Polymarket.")
        sys.exit(1)

    api_key = creds.api_key
    api_secret = creds.api_secret
    api_passphrase = creds.api_passphrase

    print("\nCredentials derived successfully!")
    print(f"  API Key:        {api_key[:8]}...")

    env_path = Path(".env")
    if not env_path.exists():
        # Copy from example
        example = Path(".env.example")
        if example.exists():
            env_path.write_text(example.read_text())
        else:
            env_path.write_text("")

    content = env_path.read_text()

    def set_env_var(text: str, key: str, value: str) -> str:
        import re
        pattern = rf"^{key}=.*$"
        replacement = f"{key}={value}"
        if re.search(pattern, text, re.MULTILINE):
            return re.sub(pattern, replacement, text, flags=re.MULTILINE)
        return text + f"\n{replacement}"

    content = set_env_var(content, "POLYMARKET_PRIVATE_KEY", private_key)
    content = set_env_var(content, "POLYMARKET_API_KEY", api_key)
    content = set_env_var(content, "POLYMARKET_API_SECRET", api_secret)
    content = set_env_var(content, "POLYMARKET_API_PASSPHRASE", api_passphrase)

    env_path.write_text(content)
    print(f"\nCredentials written to {env_path.resolve()}")
    print("\nNext steps:")
    print("  1. Fund your Polygon wallet with USDC.e")
    print("  2. Run: python scripts/bootstrap_markets.py")
    print("  3. Run: python -m tyr.main")


if __name__ == "__main__":
    main()
