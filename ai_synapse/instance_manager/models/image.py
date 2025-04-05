from django.db import models


class Image(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The full image name, e.g., 'ubuntu:22.04'"
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
        unique=True, # This specific path must be unique
        blank=False, # Make this field required
        null=False,
        help_text="REQUIRED: The exact, full image name in your custom registry that users must push to manually (e.g., myregistry.com/gpu-apps/my-analysis-image:v1.2)."
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name