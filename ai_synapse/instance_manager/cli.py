import typer
import os
import sys
# import subprocess
# from pathlib import Path
# from django.core.management import call_command
import django


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ai_synapse.ai_synapse.settings")
django.setup()

from instance_manager.models import Instance

app = typer.Typer()


@app.command()
def version():
    """Print the version of the application."""
    typer.echo("0.1.0")

@app.command()
def create_instance(
    username: str = typer.Argument(..., help="The ID or name of the instance to start."), 
    image: str = typer.Argument(..., help="The ID or name of the instance to start."), 
    ssh_key_path: str = typer.Argument(..., help="The ID or name of the instance to start."),
):
    """Creates and starts a new instance."""
    try:
        with open(ssh_key_path, "r") as file:
            ssh_key = file.read().strip()
    except Exception:
        print(f"Error: SSH key file not found at {ssh_key_path}")
        raise FileNotFoundError
    
    tailscale_ip: str = Instance.create(username=username, ssh_key=ssh_key, image=image)
    print(f"created container for username {username} with image {image} with tailscale ip {tailscale_ip}")


if __name__ == "__main__":
    app()
