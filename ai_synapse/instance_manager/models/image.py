import logging

from django.db import models
from django.conf import settings
from typing import List


logger = logging.getLogger(__name__)


class Image(models.Model):
    name = models.CharField(
        max_length=255,
        blank=False,
        null=False,
        help_text="The tag of the image'"
    )
    tag = models.CharField(
        max_length=255,
        unique=True,
        help_text="The tag of the image'"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the image."
    )
    os_name = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Operating system name, e.g., Ubuntu"
    )
    os_version = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Operating system version, e.g., 22.04"
    )
    cuda_version = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="CUDA version provided by the image, e.g., 11.8, 12.1"
    )
    cudnn_version = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="cuDNN version if provided by the image, e.g., 8.7"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_available = models.BooleanField(default=False) # only mark True if the image is available in the registry
    custom_registry_image_name = models.CharField(
        max_length=512, # Allow for long names like registry/namespace/repo:tag
        unique=True,
        blank=False,
        null=False,
        help_text="REQUIRED: The exact, full image name in your custom registry that users must push to manually (e.g., myregistry.com/gpu-apps/my-analysis-image:v1.2)."
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
    
    @classmethod
    def create(
        cls,
        name: str,
        tag: str,
        description: str = "",
        os_name: str = "",
        os_version: str = "",
        cuda_version: str = "",
        cudnn_version: str = "",
        is_available: bool = False,
    ) -> None:
        default_registry = settings.default_registry
        default_namespace = settings.default_namespace
        default_image_repository = settings.default_image_repository
        custom_registry_image_name = f"{default_registry}/{default_namespace}/{default_image_repository}:{name}"
        cls.objects.create(
            name=name,
            tag=tag,
            description=description,
            os_name=os_name,
            os_version=os_version,
            cuda_version=cuda_version,
            cudnn_version=cudnn_version,
            custom_registry_image_name=custom_registry_image_name,
            is_available=is_available,
        )
        logger.info(f"Image {name} with tag {tag} created with description {description}")

    @classmethod
    def list_all(cls) -> List["Image"]:
        return cls.objects.all()