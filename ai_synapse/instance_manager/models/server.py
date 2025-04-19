import logging

from django.db import models
from typing import List

logger = logging.getLogger(__name__)

class Server(models.Model):
    name = models.CharField(max_length=100, unique=True)
    ip_address = models.GenericIPAddressField()
    is_active = models.BooleanField(default=True)
    total_gpus = models.IntegerField()
    available_gpus = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @classmethod
    def list_all(cls) -> List["Server"]:
        return list(cls.objects.values())
    
    @classmethod
    def create(
        cls,
        name: str,
        ip_address: str,
        total_gpus: int = 2,
        is_active: bool = True,
    ) -> None:
        cls.objects.create(
            name=name, 
            ip_address=ip_address, 
            total_gpus=total_gpus, 
            available_gpus=total_gpus,
            is_active=is_active,
        )
        logger.info(f"Server {name} created with ip {ip_address}")

    @classmethod
    def get_available_server(cls):
        """Returns an available server that is not running an instance."""
        return cls.objects.filter(is_active=True).exclude(instances__status="running").select_related("instances").first()
    
    def mark_inactive(self):
        self.is_active = False
        self.save()

    def has_running_instance(self):
        return self.instances.filter(status="running").exists()