# Generated by Django 4.2.20 on 2025-04-13 12:13

from django.db import migrations, models
import instance_manager.models.instance


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="The tag of the image'", max_length=255)),
                ('tag', models.CharField(help_text="The tag of the image'", max_length=255, unique=True)),
                ('description', models.TextField(blank=True, help_text='Optional description of the image.', null=True)),
                ('os_name', models.CharField(blank=True, help_text='Operating system name, e.g., Ubuntu', max_length=100, null=True)),
                ('os_version', models.CharField(blank=True, help_text='Operating system version, e.g., 22.04', max_length=50, null=True)),
                ('cuda_version', models.CharField(blank=True, help_text='CUDA version provided by the image, e.g., 11.8, 12.1', max_length=50, null=True)),
                ('cudnn_version', models.CharField(blank=True, help_text='cuDNN version if provided by the image, e.g., 8.7', max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_available', models.BooleanField(default=False)),
                ('custom_registry_image_name', models.CharField(help_text='REQUIRED: The exact, full image name in your custom registry that users must push to manually (e.g., myregistry.com/gpu-apps/my-analysis-image:v1.2).', max_length=512, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Instance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('instance_id', models.CharField(default=instance_manager.models.instance.generate_instance_id, editable=False, max_length=100, unique=True)),
                ('instance_name', models.CharField(blank=True, max_length=100, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('running', 'Running'), ('stopped', 'Stopped')], default='pending', max_length=20)),
                ('instance_ip', models.GenericIPAddressField(blank=True, null=True, unique=True)),
                ('n_gpus', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Server',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('ip_address', models.GenericIPAddressField()),
                ('is_active', models.BooleanField(default=True)),
                ('total_gpus', models.IntegerField()),
                ('available_gpus', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateField(auto_now=True)),
            ],
        ),
    ]
