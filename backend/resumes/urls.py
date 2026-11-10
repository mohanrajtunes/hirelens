from django.urls import path

from .views import ResumeListUploadView, ResumeDetailView

urlpatterns = [
    path('', ResumeListUploadView.as_view()),
    path('<int:pk>/', ResumeDetailView.as_view()),
]