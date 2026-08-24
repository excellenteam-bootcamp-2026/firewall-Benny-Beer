from __future__ import annotations
import re

from .errors import InvalidRuleValueError

_OCTET_RE = re.compile(r"^[0-9]{1,3}$")


def is_valid_ipv4(value: str) -> bool:
    """Strict IPv4 check: 4 octets, each 0-255, no leading zeros (e.g. "01" is invalid)."""
    octets = value.split(".")
    if len(octets) != 4:
        return False

    for octet in octets:
        if not _OCTET_RE.match(octet):
            return False
        if len(octet) > 1 and octet.startswith("0"):
            return False
        if not 0 <= int(octet) <= 255:
            return False

    return True


def create_ip(value: str | int) -> str:
    if not isinstance(value, str) or not is_valid_ipv4(value):
        raise InvalidRuleValueError("INVALID_IP", f"Invalid IPv4 address: {value}")
    return value