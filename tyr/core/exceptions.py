class TyrError(Exception):
    """Base exception for all Tyr errors."""


class ConfigError(TyrError):
    """Invalid or missing configuration."""


class FeedError(TyrError):
    """Data feed connection or parsing error."""


class ExecutionError(TyrError):
    """Order placement or execution failure."""


class ValidationError(TyrError):
    """Pre-flight validation failed for an opportunity."""


class StaleOpportunityError(ValidationError):
    """Opportunity exceeded its TTL before execution."""


class RiskLimitError(TyrError):
    """Risk manager blocked execution (daily loss, position limit, etc.)."""


class MatchingError(TyrError):
    """Market matching or registry error."""
