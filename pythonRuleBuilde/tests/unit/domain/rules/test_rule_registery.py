import pytest

from src.domain.rules.ip_rule import IpRule
from src.domain.rules.rule import Rule
from src.domain.rules.rule_types import RuleType


def test_build_dispatches_to_registered_ip_rule() -> None:
    rule = Rule.build(RuleType.IP, "10.0.0.1")

    assert isinstance(rule, IpRule)
    assert rule.value == "10.0.0.1"


def test_build_raises_for_unregistered_type() -> None:
    # DomainRule/PortRule aren't migrated yet in this batch — RuleType.DOMAIN
    # is a real enum member with nothing registered against it, which is
    # exactly the "unregistered type" case. Revisit this test once a future
    # batch adds DomainRule — it'll need a different type, or removing.
    with pytest.raises(ValueError, match="No Rule class registered"):
        Rule.build(RuleType.DOMAIN, "example.com")