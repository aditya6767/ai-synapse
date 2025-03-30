import paramiko
import subprocess
import logging

from django.db import models, transaction
from django.conf import settings
from typing import List, Optional

from user_manager.models import Account

# from .server import Server

logger = logging.getLogger(__name__)

class Instance(models.Model):
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('stopped', 'Stopped'),
        ('pending', 'Pending'),
    ]

    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    server = models.ForeignKey("Server", related_name="instances", on_delete=models.CASCADE)
    instance_id = models.CharField(max_length=100, unique=True)
    image = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    instance_ip = models.GenericIPAddressField(unique=True, null=True, blank=True)
    n_gpus = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    def __str__(self):
        return f"{self.account.username}-{self.instance_id}"
    
    @classmethod
    def create(
        cls,
        # account: Account,
        username: str,
        # server: Server,
        ssh_key: str,
        image: str,
        n_gpus: int = 2
    ) -> str:
        with transaction.atomic():
            # Create and save the instance
            # container_name = f"{account.username}_container"
            container_name = f"{username}_container"
            # ssh = paramiko.SSHClient()
            # ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            # ssh.connect(
            #     hostname=server.ip_address,
            #     username="ubuntu",
            #     # key_filename="/path/to/private_key"
            # )

            # PODMAN_START_CMD = "podman run -d --name {container_name} --network=host {image}"
            # TAILSCALE_IP_CMD = "podman exec {container_name} tailscale ip -4" 
            # # Start Podman container
            # podman_command = PODMAN_START_CMD.format(container_name=container_name, image=image)
            # stdin, stdout, stderr = ssh.exec_command(podman_command)
            # instance_id = stdout.read().decode().strip()

            command = [
                "podman", "run",
                "--name", container_name,
                "--cap-add", "net_admin",
                "--device", "/dev/net/tun:/dev/net/tun",
                # "--volume", "/home/aditya/toni/:/home/ubuntu/",
                "--replace", "-d",
                image
            ]

            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            if result.returncode == 0:
                instance_id = result.stdout.strip()
                logger.info(f"Container started successfully: {result.stdout.strip()}")
            else:
                raise Exception(f"Error starting container: {result.stderr.strip()}")
    

            if not instance_id:
                # error_msg = stderr.read().decode()
                error_msg = result.stderr.strip()
                # logger.error(f"Couldn't start container {instance_id} on {server.name}, {error_msg}")
                # raise Exception(f"Couldn't start container {instance_id} on {server.name}, {error_msg}")
                logger.error(f"Couldn't start container {instance_id}, {error_msg}")
                raise Exception(f"Couldn't start container {instance_id}, {error_msg}")
            
            # # Get Tailscale IP of the container
            # stdin, stdout, stderr = ssh.exec_command(TAILSCALE_IP_CMD)
            # tailscale_ip = stdout.read().decode().strip()

            # if not tailscale_ip:
            #     error_msg = stderr.read().decode()
            #     logger.error(f"Couldn't get Tailscale IP for container {instance_id} on {server.name}, {error_msg}")
            #     raise Exception(f"Couldn't get Tailscale IP for container {instance_id} on {server.name}, {error_msg}")

            # ssh.close()

            # ssh_public_key = account.ssh_public_key
            ssh_public_key = ssh_key


            command = [
                "podman", "exec", container_name, "bash", "-c",
                f"chown -R ubuntu:ubuntu /home/ubuntu && "
                f"mkdir -p /home/ubuntu/.ssh && "
                f"chmod 700 /home/ubuntu/.ssh && "
                f"echo '{ssh_public_key}' >> /home/ubuntu/.ssh/authorized_keys && "
                f"chmod 600 /home/ubuntu/.ssh/authorized_keys && "
                f"chown -R ubuntu:ubuntu /home/ubuntu && "
                f"tailscale up --authkey= --advertise-tags=tag:container"
            ]
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            # result = subprocess.run([
            #     "podman", "exec", container_name,
            #     "tailscale", "up", f"--authkey={settings.TAILSCALE_AUTH_KEY}" # --hostname=container_name
            # ])

            if result.returncode == 0:
                logger.info(f"started tailscale")
            else:
                raise Exception(f"Error starting tailscale: {result.stderr.strip()}")
            
            command = ["podman", "exec", container_name, "tailscale", "ip", "-4"]
            result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            if result.returncode == 0:
                tailscale_ip = result.stdout.strip()
                logger.info(f"Tailscale IP: {tailscale_ip}")
            else:
                raise Exception(f"Error fetching Tailscale IP: {result.stderr.strip()}")
            
            if not tailscale_ip:
                error_msg = result.stderr.strip()
                logger.error(f"Error fetching Tailscale IP: {result.stderr.strip()}")
                raise Exception(f"Error fetching Tailscale IP: {result.stderr.strip()}")
            
            # instance = Instance.objects.create(
            #     account=account,
            #     server=server,
            #     image=image,
            #     n_gpus=n_gpus,
            #     instance_id=instance_id,
            #     tailscale_ip=tailscale_ip,
            #     status="running",            
            # )

            # server = instance.server
            # server.available_gpus = server.available_gpus - n_gpus
            # server.save()
            logger.info(f"Instance started successfully with {instance_id} - Tailscale IP: {tailscale_ip}")

        return tailscale_ip
    
    def start(
        self,
    ) -> None:
        logger.info(f"Starting instance {self.instance_id} for user {self.account.username}")
        # ssh = paramiko.SSHClient()
        # ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # ssh.connect(
        #     hostname=self.server.ip_address,
        #     username=f"{self.account.username}",
        #     key_filename="/path/to/private_key"
        # )

        # PODMAN_START_CMD = "podman start {container_id}"
        # start_command = PODMAN_START_CMD.format(container_id=self.container_id)
        # stdin, stdout, stderr = ssh.exec_command(start_command)

        # error_output = stderr.read().decode().strip()
        # if error_output:
        #     logger.error(f"Error starting container {self.container_id}: {error_output}")
        #     raise Exception(f"Error starting container {self.container_id}: {error_output}")

        container_id = self.instance_id
        command = f"podman start {container_id}"

        result = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if result.returncode == 0:
            logger.info(f"Started {container_id} successfully")
        else:
            raise Exception(f"Error starting container {container_id}: {result.stderr.strip()}")
        self.status = "running"
        self.save()

        server = self.server
        server.available_gpus = server.available_gpus - self.n_gpus
        server.save()

        # ssh.close()

        logger.info(f"Instance {self.instance_id} started successfully")

    def stop(
        self
    ) -> None:
        logger.info(f"Stopping instance {self.container_id} for user {self.account.username}")
        # ssh = paramiko.SSHClient()
        # ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # ssh.connect(
        #     hostname=instance.server.ip_address,
        #     username=f"{account.username}",
        #     key_filename="/path/to/private_key"
        # )

        # PODMAN_STOP_CMD = "podman stop {container_id} && podman rm {container_id}"
        # stop_command = PODMAN_STOP_CMD.format(container_id=instance.container_id)
        # stdin, stdout, stderr = ssh.exec_command(stop_command)

        # error_output = stderr.read().decode().strip()
        # if error_output:
        #     logger.error(f"Error stopping container {instance.container_id}: {error_output}")
        #     raise Exception(f"Error stopping container {instance.container_id}: {error_output}")

        container_id = self.container_id
        command = f"podman stop {container_id} && podman rm {container_id}"

        result = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if result.returncode == 0:
            logger.info(f"Stopped {container_id} successfully")
        else:
            raise Exception(f"Error stopping container {container_id}: {result.stderr.strip()}")
        self.status = "stopped"
        self.save()

        server = self.instance.server
        server.available_gpus = server.available_gpus + self.instance.n_gpus
        server.save()

        # ssh.close()

        logger.info(f"Instance {self.instance.container_id} stopped successfully")

    @classmethod
    def list_all(cls, account: Account) -> List["Instance"]:
        if account.is_superuser:
            return cls.objects.filter(account=account)
        return cls.objects.all()
