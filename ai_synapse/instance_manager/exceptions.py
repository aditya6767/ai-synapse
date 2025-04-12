
class InstanceAlreadyRunningException(Exception):
    """Raised when attempting to start an instance that is already running."""
    pass

class InstanceAlreadyStoppedException(Exception):
    """Raised when an attempt to start an instance fails for technical reasons."""
    # You could add more specific failure exceptions inheriting from this
    pass
