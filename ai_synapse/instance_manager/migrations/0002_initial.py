# Generated by Django 4.2.19 on 2025-02-28 14:36

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('instance_manager', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='instance',
            name='account',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='instance',
            name='server',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instances', to='instance_manager.server'),
        ),
    ]
