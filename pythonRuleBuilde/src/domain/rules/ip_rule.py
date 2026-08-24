from __future__ import annotations

from .ip_type import create_ip
from .rule import Rule
from .rule_types import RuleType


class IpRule(Rule):
    @property
    def type(self) -> RuleType:
        return RuleType.IP

    @classmethod
    def create(cls, raw_value: str | int, active: bool = True) -> "IpRule":
        ip = create_ip(raw_value)  # raises InvalidRuleValueError if invalid
        return cls(ip, active, _key=Rule._construct_key)


Rule.register(RuleType.IP, IpRule)
