from django.core.management.base import BaseCommand


from instance_manager.models import Instance
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Create and start a new Podman instance for a user"

    def add_arguments(self, parser):
        parser.add_argument("--username", type=str, required=True, help="Username of the instance owner")
        parser.add_argument("--image", type=str, required=True, help="Podman image to use")
        parser.add_argument("--ssh_key_path", type=str, help="Path to SSH public key")

    def handle(self, *args, **options):
        username = options["username"]
        image = options["image"]
        ssh_key_path = options["ssh_key_path"]

        try:
            with open(ssh_key_path, "r") as file:
                ssh_key = file.read().strip()
        except Exception:
            print(f"Error: SSH key file not found at {ssh_key_path}")
            raise FileNotFoundError
        
        tailscale_ip: str = Instance.create(username=username, image=image, ssh_key=ssh_key)

        print(f"created container for username {username} with image {image} with tailscale ip {tailscale_ip}")

