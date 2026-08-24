import pytest

from src.domain.rules.errors import InvalidRuleValueError
from src.domain.rules.ip_type import create_ip, is_valid_ipv4


@pytest.mark.parametrize(
    "value",
    [
        "0.0.0.0",
        "255.255.255.255",
        "10.0.0.1",
        "0.2.3.4",   # bare zero octet is fine — only a *leading* zero is rejected
        "1.2.3.0",
    ],
)
def test_valid_ipv4_accepted(value: str) -> None:
    assert is_valid_ipv4(value) is True


@pytest.mark.parametrize(
    "value",
    [
        "01.2.3.4",    # leading zero
        "1.2.3.04",    # leading zero, not just in the first octet
        "1.2.3.4.5",   # too many octets
        "1.2.3",       # too few octets
        "256.1.1.1",   # out of range
        "1.2.3.-1",    # negative
        "1.2.3.a",     # non-digit
        "1..3.4",      # empty octet
        "",            # empty string
    ],
)
def test_invalid_ipv4_rejected(value: str) -> None:
    assert is_valid_ipv4(value) is False


def test_create_ip_returns_value_when_valid() -> None:
    assert create_ip("10.0.0.1") == "10.0.0.1"


def test_create_ip_raises_with_stable_code_when_invalid() -> None:
    with pytest.raises(InvalidRuleValueError) as exc_info:
        create_ip("999.1.1.1")

    assert exc_info.value.code == "INVALID_IP"


def test_create_ip_rejects_non_string_input() -> None:
    with pytest.raises(InvalidRuleValueError):
        create_ip(12345)