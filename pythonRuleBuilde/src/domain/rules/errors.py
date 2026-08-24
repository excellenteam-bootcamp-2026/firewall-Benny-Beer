class InvalidRuleValueError(Exception):
    """Raised when a raw value fails its rule type's business validation.

    Carries a stable `code` (e.g. "INVALID_IP") that callers and tests can
    depend on, separate from the human-readable message.
    """

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message