from setuptools import setup, find_packages

setup(
    name="sanas-ai-synapse",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "django",
        "djangorestframework",
        "psycopg[binary]",
        "django-extensions",
        "typer[all]"
    ],
    entry_points={
        "console_scripts": [
            "sanas-ai-synapse=ai_synapse.instance_manager.cli:app",
        ],
    },
)
