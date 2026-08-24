from __future__ import annotations

from abc import ABC, abstractmethod
from typing import ClassVar

from .rule_types import RuleType


class Rule(ABC):
    """A validated firewall rule value plus its on/off flag.

    Instances may only be constructed via a subclass's `create()` classmethod,
    where business-rule validation happens — direct construction is rejected
    at runtime so a `Rule` instance is always trustworthy evidence its value
    was validated.

    `id` and `mode` are storage concerns and deliberately live outside the
    entity — see StoredRule on the repository port.
    """

    _registry: ClassVar[dict[RuleType, type[Rule]]] = {}
    _construct_key: ClassVar[object] = object()

    def __init__(self, value: str | int, active: bool = True, *, _key: object = None) -> None:
        if _key is not Rule._construct_key:
            raise TypeError(f"{type(self).__name__} must be built via .create(), not constructed directly")
        self._value = value
        self._active = active

    @property
    def value(self) -> str | int:
        return self._value

    @property
    def active(self) -> bool:
        return self._active

    def activate(self) -> None:
        self._active = True

    def deactivate(self) -> None:
        self._active = False

    @property
    @abstractmethod
    def type(self) -> RuleType:
        """The type tag this rule is registered under."""

    @classmethod
    @abstractmethod
    def create(cls, raw_value: str | int, active: bool = True) -> Rule:
        """Validate `raw_value` and construct an instance, or raise."""

    @staticmethod
    def register(rule_type: RuleType, ctor: type[Rule]) -> None:
        """Called by each subclass, once, to register itself under its type tag."""
        Rule._registry[rule_type] = ctor

    @staticmethod
    def build(rule_type: RuleType, raw_value: str | int, active: bool = True) -> Rule:
        """Generic factory — looks up the right subclass by type and delegates."""
        ctor = Rule._registry.get(rule_type)
        if ctor is None:
            raise ValueError(f"No Rule class registered for type {rule_type!r}")
        return ctor.create(raw_value, active)