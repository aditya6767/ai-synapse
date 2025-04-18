# backend/main_app/views.py
from django.shortcuts import render

def index(request):
    # Ensure the template path matches your structure
    return render(request, "ai_synapse/index.html")