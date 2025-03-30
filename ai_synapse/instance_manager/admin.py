# from django.contrib import admin
# from django.utils.html import format_html
# from .models import Instance

# # class InstanceAdmin(admin.ModelAdmin):
# #     list_display = ("instance_id", "status", "created_at", "start_instance_button", "stop_instance_button")

# #     def start_instance_button(self, obj):
# #         return format_html('<a class="button" href="{}">Start</a>', f"/admin/start-instance/{obj.id}")

# #     def stop_instance_button(self, obj):
# #         return format_html('<a class="button" href="{}">Stop</a>', f"/admin/stop-instance/{obj.id}")

# #     start_instance_button.allow_tags = True
# #     stop_instance_button.allow_tags = True

# # admin.site.register(Instance, InstanceAdmin)

# from django.contrib import admin
# from django.utils.html import format_html
# from django.urls import reverse
# from django.http import HttpResponseRedirect
# from django import forms
# from django.shortcuts import redirect
# from .models import Instance

# # class StartInstanceForm(forms.Form):
# #     """A hidden form to submit a POST request to Start Instance View"""
# #     image = forms.CharField(widget=forms.HiddenInput())

# # class InstanceAdmin(admin.ModelAdmin):
# #     list_display = ("instance_id", "status", "created_at", "start_instance_button")

# #     def start_instance_button(self, obj):
# #         url = reverse("start_instance", args=[obj.id])
# #         return format_html(
# #             '<form action="{}" method="post">'
# #             '<input type="hidden" name="csrfmiddlewaretoken" value="{}">'
# #             '<button type="submit" class="button">Start</button>'
# #             '</form>',
# #             url,
# #             "{csrf_token}"
# #         )

# #     start_instance_button.allow_tags = True  # Allows rendering HTML inside Django Admin

# # admin.site.register(Instance, InstanceAdmin)

# from django.contrib import admin
# from django.urls import path
# from django.shortcuts import redirect
# from django.contrib import messages
# from django.http import HttpRequest
# from rest_framework.request import Request

# from .models import Instance
# from .views import StartInstanceView, StopInstanceView, CreateInstanceView

# class InstanceAdmin(admin.ModelAdmin):
#     list_display = ("name", "status", "created_at", "start_button", "stop_button")

#     def get_urls(self):
#         """ Registers custom URLs in Django Admin """
#         urls = super().get_urls()
#         custom_urls = [
#             path("create-instance/", self.admin_site.admin_view(self.create_instance_view), name="create_instance"),
#             path("start-instance/<int:instance_id>/", self.admin_site.admin_view(self.start_instance_view), name="start_instance"),
#             path("stop-instance/<int:instance_id>/", self.admin_site.admin_view(self.stop_instance_view), name="stop_instance"),
#         ]
#         return custom_urls + urls

#     def create_instance_view(self, request: HttpRequest):
#         """ Calls the CreateInstanceView API manually """
#         if request.method == "POST":
#             image = request.POST.get("image")

#             if not image:
#                 messages.error(request, "Instance name and image are required!")
#                 return redirect("/admin/instance_manager/instance/")

#             drf_request = Request(request)  # Wrap in DRF's Request object
#             response = CreateInstanceView.as_view()(drf_request)  # Call the CBV

#             if response.status_code == 201:
#                 messages.success(request, f"Instance '{name}' created successfully!")
#             else:
#                 messages.error(request, f"Failed to create instance: {response.data}")

#         return redirect("/admin/instance_manager/instance/")

#     def start_instance_view(self, request: HttpRequest, instance_id):
#         """ Calls the StartInstanceView API manually """
#         instance = Instance.objects.get(id=instance_id)
#         drf_request = Request(request)
#         response = StartInstanceView.as_view()(drf_request, name=instance.name)

#         if response.status_code == 200:
#             messages.success(request, f"Instance '{instance.name}' started successfully!")
#         else:
#             messages.error(request, f"Failed to start instance: {response.data}")

#         return redirect("/admin/instance_manager/instance/")

#     def stop_instance_view(self, request: HttpRequest, instance_id):
#         """ Calls the StopInstanceView API manually """
#         instance = Instance.objects.get(id=instance_id)
#         drf_request = Request(request)
#         response = StopInstanceView.as_view()(drf_request, name=instance.name)

#         if response.status_code == 200:
#             messages.success(request, f"Instance '{instance.name}' stopped successfully!")
#         else:
#             messages.error(request, f"Failed to stop instance: {response.data}")

#         return redirect("/admin/instance_manager/instance/")

#     def start_button(self, obj):
#         """ Adds a Start button for each instance """
#         return f'<a class="button" href="/admin/start-instance/{obj.id}/">Start</a>'

#     def stop_button(self, obj):
#         """ Adds a Stop button for each instance """
#         return f'<a class="button" href="/admin/stop-instance/{obj.id}/">Stop</a>'

#     start_button.allow_tags = True
#     stop_button.allow_tags = True

# admin.site.register(Instance, InstanceAdmin)
