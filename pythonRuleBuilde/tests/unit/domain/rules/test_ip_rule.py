import pytest

from src.domain.rules.errors import InvalidRuleValueError
from src.domain.rules.ip_rule import IpRule
from src.domain.rules.rule_types import RuleType


def test_create_builds_ip_rule_with_validated_value() -> None:
    rule = IpRule.create("10.0.0.1")

    assert rule.value == "10.0.0.1"
    assert rule.type == RuleType.IP
    assert rule.active is True


def test_create_respects_explicit_active_false() -> None:
    rule = IpRule.create("10.0.0.1", active=False)
    assert rule.active is False


def test_create_raises_invalid_rule_value_error_for_bad_ip() -> None:
    with pytest.raises(InvalidRuleValueError) as exc_info:
        IpRule.create("999.1.1.1")

    assert exc_info.value.code == "INVALID_IP"


def test_deactivate_then_activate_toggles_active() -> None:
    rule = IpRule.create("10.0.0.1")

    rule.deactivate()
    assert rule.active is False

    rule.activate()
    assert rule.active is True


def test_direct_construction_without_key_is_rejected() -> None:
    with pytest.raises(TypeError):
        IpRule("10.0.0.1", True)