import paramiko
import subprocess
import logging
import io
import re
import uuid

from django.db import models, transaction, IntegrityError
from django.utils.translation import gettext_lazy as _
from paramiko import SSHClient
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from typing import List, Optional

from user_manager.models import Account

from .server import Server
from .image import Image

from ..exceptions import (
    InstanceAlreadyRunningException, 
    InstanceAlreadyStoppedException
)


logger = logging.getLogger(__name__)

def generate_instance_id():
    return f"i-{uuid.uuid4().hex[:17]}" 

class InstanceStatus(models.TextChoices):
    PENDING = 'pending', _('Pending')
    RUNNING = 'running', _('Running')
    STOPPED = 'stopped', _('Stopped')

class Instance(models.Model):
    instance_id = models.CharField(max_length=100, unique=True, default=generate_instance_id, editable=False)
    instance_name = models.CharField(max_length=100, blank=True, null=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    server = models.ForeignKey("Server", related_name="instances", on_delete=models.CASCADE)
    image = models.ForeignKey(
        Image,
        related_name="instances",
        on_delete=models.PROTECT,
        help_text="The container image used for this instance."
    )
    status = models.CharField(max_length=20, choices=InstanceStatus.choices, default=InstanceStatus.PENDING)
    instance_ip = models.GenericIPAddressField(unique=True, null=True, blank=True) # currently instance ip is same as server ip
    n_gpus = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    def __str__(self):
        return f"{self.account.username}-{self.instance_id}"
    
    @classmethod
    def create(
        cls,
        account: Account,
        server: Server,
        image: str,
        n_gpus: int = 1,
    ) -> str:
        try:
            instance: Instance = cls.objects.create(
                account=account,
                server=server,
                image=image,
                n_gpus=n_gpus,
            )
            instance_id = instance.instance_id
            return instance_id
        except IntegrityError as e:
            logger.error(f"Instance creation failed due to integrity issue: {e}")
            raise ValueError("Failed to create instance due to a constraint violation.")
        except Exception as e:
            logger.error(f"Error creating instance: {e}")
            raise e

    def start(self) -> None:
        """
        Connects to the instance's server and starts its associated Podman container.
        Ensures idempotency and updates instance status.
        """
        with transaction.atomic():
            ssh: paramiko.SSHClient | None = None # Ensure ssh client is defined for finally block

            try:
                server = self.server
                image_obj = self.image
                account = self.account

                username = account.username
                if not username: raise ValueError(f"Account {account.id} has no username.")

                # Use instance ID as the unique container name for simplicity and reliability
                container_name = self._get_container_name(username)

                logger.info(f"Processing start request for instance {self.instance_id} (Container: {container_name}) on {server.name}")

                # Check image usability from Django model first
                # Add ingestion status check back here if you implement it later
                if not image_obj.is_available:
                    raise ValueError(f"Image '{image_obj.name}' is marked as unavailable.")
                registry_image_name = image_obj.custom_registry_image_name
                if not registry_image_name:
                    raise ValueError(f"Image '{image_obj.name}' missing custom registry name.")

                ssh = self._connect_ssh(server.ip_address)

                logger.debug(f"Checking current state of container '{container_name}' on {server.name}...")
                is_currently_running = self._check_user_container_running(ssh, container_name, server.name)

                if is_currently_running:
                    logger.info(f"Container '{container_name}' for instance {self.instance_id} is already running on {server.name}.")
                    if self.status != InstanceStatus.RUNNING:
                        logger.warning(f"Instance {self.instance_id} DB status was '{self.status}', updating to RUNNING.")
                        self.status = InstanceStatus.RUNNING
                        self.save()
                    raise InstanceAlreadyRunningException

                # If not running, attempt cleanup before starting
                logger.info(f"Container '{container_name}' not running. Attempting cleanup before start...")
                self._stop_and_remove_container(ssh, container_name, server.name)
                
                self.status = InstanceStatus.PENDING
                self.save()

                logger.debug(f"Preparing volumes for user '{username}'")
                volume_args = self._get_volume_mounts(username)

                logger.debug(f"Ensuring image '{registry_image_name}' is pulled on {server.hostname}")
                self._ensure_image_pulled(ssh, registry_image_name, server.hostname)

                logger.info(f"Attempting to run container '{container_name}'...")
                container_id = self._run_podman_container(
                    ssh,
                    container_name,
                    image_obj,
                    volume_args,
                    self.instance_id,
                    server
                )

                logger.info(f"Container '{container_id}' started. Fetching IP address...")
                self.instance_ip = server.instance_ip
                self.status = InstanceStatus.RUNNING
                self.save()
                logger.info(f"Instance {self.instance_id} (Container {container_id}) successfully started and marked as running on {server.name}")

            except Exception as e:
                logger.error(f"Failed to start instance {self.instance_id}: {e}")
                raise
            finally:
                if ssh:
                    try:
                        ssh.close()
                        logger.debug(f"SSH connection closed for {server.hostname if 'server' in locals() else 'unknown server'}")
                    except Exception as e_close:
                        logger.error(f"Error closing SSH connection: {e_close}")

    def stop_instance(self) -> None:
        """
        Connects to the instance's server and stops & removes its associated Podman container.
        Updates instance status appropriately.
        """
        with transaction.atomic():
            ssh: paramiko.SSHClient | None = None # Ensure ssh client is defined for finally block

            try:
                ssh = self._connect_ssh(server.name)
                server = self.server
                if not server:
                    if self.status == InstanceStatus.STOPPED:
                        logger.info(f"Instance {self.instance_id} already stopped and has no server assigned.")
                        return True
                    raise ValueError(f"Instance {self.instance_id} has no Server association, cannot determine where to stop.")

                container_identifier = self.instance_id

                logger.info(f"Processing stop request for instance {self.instance_id} on {server.name}")

                is_running = self._check_user_container_running(ssh, container_identifier, server.name)
                if not is_running:
                    logger.info(f"Container '{container_identifier}' for instance {self.instance_id} is already stopped on {server.name}.")
                    if self.status != InstanceStatus.STOPPED:
                        logger.warning(f"Instance {self.instance_id} DB status was '{self.status}', updating to STOPPED.")
                        self.status = InstanceStatus.STOPPED
                        self.save()
                    raise InstanceAlreadyStoppedException
                       
                self._stop_and_remove_container(
                    ssh,
                    container_identifier,
                    server.name
                )
            except Exception as e:
                logger.error(f"Failed to complete stop process for instance {self.instance_id}: {e}")
                raise 
            finally:
                if ssh:
                    try:
                        ssh.close()
                        logger.debug(f"SSH connection closed for {server.name}")
                    except Exception as e_close:
                        logger.error(f"Error closing SSH connection: {e_close}")


    def _connect_ssh(self, ip_address: str) -> SSHClient:
        """Establish an SSH connection to the instance."""

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(
            hostname=ip_address,
            username=settings.SSH_USERNAME,
            timeout=60,
        )
        return ssh
    
    def _get_container_name(self, username: str) -> str:
        container_name = f"{self.instance_id}-{username}-container"
        return container_name
    
    def _get_volume_mounts(self, username: str) -> List[str]:
        """
        Retrieve the configured volume mount paths from Django settings
        and format them for Podman.
        """
        mount_paths = []
        try:
            podman_settings = getattr(settings, 'PODMAN_SETTINGS', {})
            mount_paths = podman_settings.get('mount_paths', [])
        except Exception as e:
            logger.exception(f"Error accessing Podman mount path settings: {e}")
            raise ImproperlyConfigured(f"Error accessing Podman mount path settings: {e}") from e

        formatted_mounts = []
        for mount_template in mount_paths:
            try:
                formatted_path = mount_template.format(username=username)
                formatted_mounts.append(f"--volume {formatted_path}")
            except KeyError:
                logger.warning(f"Mount path template '{mount_template}' does not "
                            f"contain '{{username}}' placeholder. Using as is.")
                formatted_mounts.append(f"--volume {mount_template}")
            except Exception as e:
                logger.exception(f"Error formatting mount path '{mount_template}' "
                                f"for user '{username}': {e}")
                raise ValueError(f"Error formatting mount path '{mount_template}': {e}") from e

        return formatted_mounts
    
    def _run_podman_container(
        self, 
        ssh: SSHClient, 
        container_name: str, 
        image: Image, 
        volume_args: List[str], 
        instance_id: str,
        server: Server,
    ) -> str:
        """
        Run the Podman container using settings from Django settings.py.
        """
        
        registry_image_name = image.custom_registry_image_name

        try:
            podman_settings = getattr(settings, 'PODMAN_SETTINGS', {})
            default_shm_size = podman_settings.get('default_shm_size', '1G')
            default_pid_limit = podman_settings.get('default_pid_limit', -1)

        except Exception as e:
            logger.exception(f"Error accessing Podman settings (shm_size, pid_limit): {e}")
            raise ImproperlyConfigured(f"Error accessing Podman settings: {e}") from e

        podman_command_list = [
            "sudo",
            "podman",
            "run",
            "--name", container_name,
            "--hostname", instance_id,
            "--privileged",
            "--systemd", "always",
            "--device", "nvidia.com/gpu=all",
            "--umask=0000",
            "--ulimit", "memlock=-1:-1",
            f"--shm-size={default_shm_size}",
            f"--pids-limit {default_pid_limit}",
            "--cap-add", "net_admin",
            "--cap-add", "AUDIT_CONTROL",
            "--device", "/dev/net/tun:/dev/net/tun",
            "-p", "2222:22", # required to ssh into the container -> ssh -p 2222 ubuntu@server.ip_address
            "--replace",
            "-d",
        ] + volume_args + [registry_image_name]
        
        podman_command_str = " ".join(map(str, podman_command_list))
        logger.debug(f"Executing Podman command on {instance_id}: {podman_command_str}")

        try:
            stdin, stdout, stderr = ssh.exec_command(podman_command_str)
            exit_status = stdout.channel.recv_exit_status()

            container_id = stdout.read().decode().strip()
            error_output = stderr.read().decode().strip()

            if exit_status != 0:
                logger.error(f"Podman command failed on {server.name} with exit status {exit_status}. Error: {error_output}. Command: {podman_command_str}")
                raise Exception(f"Podman command failed on server {server.name}. Error: {error_output}")

            if not container_id:
                logger.error(
                    f"Podman command succeeded (Exit Status 0) but no container ID returned on {server.name}. Stderr: {error_output}. Stdout: {stdout.read().decode().strip()}. Command: {podman_command_str}"
                )
                raise Exception(f"Instance {instance_id} started but failed to retrieve Container ID.")

            logger.info(f"Successfully started container {container_id} ({container_name}) on {server.name}")
            return container_id

        except Exception as e:
            logger.exception(f"Failed to execute Podman command or process result on {instance_id}: {e}")
            if isinstance(e, (Exception, ImproperlyConfigured)):
                raise
            else:
                raise Exception(f"SSH execution failed on {instance_id}: {e}") from e
            
    def _stop_and_remove_container(self, ssh, container_name: str, server_name: str) -> None:
        """
        Stop and remove the specified Podman container, using Django settings.
        Runs stop and remove as separate commands for better error handling.
        """
        try:
            podman_settings = getattr(settings, 'PODMAN_SETTINGS', {})
            stop_timeout = podman_settings.get('stop_timeout', 10)
            force_remove = podman_settings.get('force_remove', False)
            ignore_not_found = podman_settings.get('ignore_remove_not_found', True)
            ssh_timeout = podman_settings.get('ssh_exec_timeout', 60)
        except Exception as e:
            logger.exception(f"Error accessing Podman stop/remove settings: {e}")
            raise ImproperlyConfigured(f"Error accessing Podman stop/remove settings: {e}") from e

        stop_command = f"sudo podman stop -t {stop_timeout} {container_name}"
        logger.debug(f"Executing stop command on {server_name}: {stop_command}")
        try:
            stdin, stdout, stderr = ssh.exec_command(stop_command, timeout=ssh_timeout)
            exit_status = stdout.channel.recv_exit_status()
            stderr_output = stderr.read().decode().strip()

            if exit_status == 0:
                logger.info(f"Container {container_name} stopped successfully on {server_name}")
            elif exit_status == 125 or "no such container" in stderr_output.lower():
                logger.warning(f"Container {container_name} not found on {server_name} during stop attempt (treating as stopped).")
            else:
                logger.error(f"Failed to stop container {container_name} on {server_name}. Exit: {exit_status}, Error: {stderr_output}")
                raise Exception(f"Failed to stop container {container_name} on {server_name}. Error: {stderr_output}")
        except Exception as e:
            logger.exception(f"Error executing stop command for {container_name} on {server_name}: {e}")
            raise Exception(f"Failed during stop operation for {container_name} on {server_name}: {e}") from e

        remove_command_parts = [f"sudo podman", "rm"]
        if force_remove:
            remove_command_parts.append("-f")
        remove_command_parts.append(container_name)
        remove_command = " ".join(remove_command_parts)

        logger.debug(f"Executing remove command on {server_name}: {remove_command}")
        try:
            stdin, stdout, stderr = ssh.exec_command(remove_command, timeout=ssh_timeout)
            exit_status = stdout.channel.recv_exit_status()
            stderr_output = stderr.read().decode().strip()

            if exit_status == 0:
                logger.info(f"Container {container_name} removed successfully on {server_name}.")
            elif (exit_status == 125 or "no such container" in stderr_output.lower()):
                if ignore_not_found:
                    logger.warning(f"Container {container_name} not found on {server_name} during remove attempt (ignored).")
                else:
                    logger.error(f"Container {container_name} not found on {server_name} during remove attempt (Error). Exit: {exit_status}, Message: {stderr_output}")
                    raise Exception(f"Container {container_name} not found on {server_name} during remove.")
            else:
                logger.error(f"Failed to remove container {container_name} on {server_name}. Exit: {exit_status}, Error: {stderr_output}")
                raise Exception(f"Failed to remove container {container_name} on {server_name}. Error: {stderr_output}")

        except Exception as e:
            if not isinstance(e, ImproperlyConfigured):
                logger.exception(f"Error executing remove command for {container_name} on {server_name}: {e}")
                raise Exception(f"Failed during remove operation for {container_name} on {server_name}: {e}") from e
            else:
                raise e
            
    def _ensure_image_pulled(self, ssh, image_name_in_registry: str, instance_id: str) -> bool:
        """
        Attempts to pull the specified image from the custom registry on the remote host.
        This serves as validation that the user manually pushed the image.
        """
        podman_settings = getattr(settings, 'PODMAN_SETTINGS', {})
        ssh_timeout = podman_settings.get('ssh_exec_timeout_pull', 300) # e.g., 5 minutes

        # Ensure the target server's podman is logged into the registry
        pull_command = f"sudo podman pull {image_name_in_registry}"
        logger.info(f"Verifying image '{image_name_in_registry}' exists on {instance_id} by pulling...")
        try:
            stdin, stdout, stderr = ssh.exec_command(pull_command, timeout=ssh_timeout)
            exit_status = stdout.channel.recv_exit_status()
            stderr_output = stderr.read().decode().strip()

            if exit_status == 0:
                logger.info(f"Image '{image_name_in_registry}' is available locally on {instance_id}.")
                return True
            else:
                logger.error(f"Failed to pull image '{image_name_in_registry}' on {instance_id}. "
                            f"Ensure it was pushed manually to the registry. Exit: {exit_status}, Error: {stderr_output}")
                error_detail = stderr_output or f"Podman pull command failed with exit code {exit_status}."
                raise Exception(f"Image '{image_name_in_registry}' not found or pull failed: {error_detail}")
        except Exception as e:
            logger.exception(f"Error during image pull verification for '{image_name_in_registry}' on {instance_id}: {e}")
            if isinstance(e, Exception) and "Image" in str(e) and ("not found" in str(e) or "pull failed" in str(e)):
                raise
            else:
                raise Exception(f"System error during image pull verification on {instance_id}: {e}") from e

    def _check_user_container_running(self, ssh: paramiko.SSHClient, container_name: str, hostname: str) -> bool:
        """
        Checks if a container with the given name is currently in 'running' state
        on the remote host using 'podman inspect'.
        """
        logger.debug(f"Checking running status for container '{container_name}' on {hostname}")
        podman_settings = getattr(settings, 'PODMAN_SETTINGS', {})
        ssh_timeout = podman_settings.get('ssh_exec_timeout_short', 20)

        command = f"sudo podman inspect {container_name} --format '{{{{.State.Status}}}}'"
        logger.debug(f"Executing status check command: {command}")

        try:
            stdin, stdout, stderr = ssh.exec_command(command, timeout=ssh_timeout)
            stderr_output = stderr.read().decode().strip()
            status_output = stdout.read().decode().strip()
            exit_status = stdout.channel.recv_exit_status()

            if exit_status == 0:
                actual_status = status_output.lower()
                logger.debug(f"Container '{container_name}' on {hostname} reported raw status: '{actual_status}'")
                if actual_status == 'running':
                    logger.info(f"Container '{container_name}' on {hostname} confirmed running.")
                    return True
                else:
                    logger.info(f"Container '{container_name}' on {hostname} exists but status is '{actual_status}' (not 'running').")
                    return False
            else:
                if exit_status == 125 or "no such container" in stderr_output.lower():
                     logger.info(f"Container '{container_name}' not found on {hostname}.")
                     return False
                else:
                     logger.error(f"Podman inspect command failed unexpectedly for '{container_name}' on {hostname}. Exit: {exit_status}, Stderr: {stderr_output}")
                     return False
        except Exception as e:
            logger.exception(f"Error executing SSH command for status check of container '{container_name}' on {hostname}: {e}")
            raise Exception(f"Failed to execute status check command on {hostname}: {e}") from e

    @classmethod
    def list_all(cls, account: Account) -> List["Instance"]:
        if account.is_superuser:
            return cls.objects.filter(account=account)
        return cls.objects.all()
