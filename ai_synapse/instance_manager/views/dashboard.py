# backend/instance_manager/views/dashboard.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required # Example: Protect the view

# @login_required # Uncomment if users must be logged in
def dashboard_view(request):
    """
    Renders the main instance manager dashboard/list page,
    which will load the Vite assets via the base template.
    """
    # Later you'll fetch instance data etc.
    context = {
        # 'instance_list': Instance.objects.filter(account=...),
    }
    # Make sure the template path matches where you put it
    return render(request, "instance_manager/dashboard.html", context)