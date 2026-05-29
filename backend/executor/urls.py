from django.urls import path
from .views import ExecuteCodeview

urlpatterns = [
    path('execute/', ExecuteCodeview.as_view(), name='execute-code'),
]