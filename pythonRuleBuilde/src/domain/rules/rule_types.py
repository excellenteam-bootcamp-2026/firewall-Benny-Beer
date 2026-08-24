from enum import Enum


class RuleMode(Enum):
    """How a rule is applied. Storage concern — not carried on the Rule entity."""
    BLACKLIST = "blacklist"
    WHITELIST = "whitelist"


class RuleType(Enum):
    """Discriminator used by the Rule registry to dispatch to a concrete subclass."""
    IP = "ip"
    DOMAIN = "domain"
    PORT = "port"

