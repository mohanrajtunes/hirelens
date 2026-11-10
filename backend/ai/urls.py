from django.urls import path

from .views import MatchView, CoverNoteView

urlpatterns = [
    path('match/', MatchView.as_view()),
    path('cover-note/', CoverNoteView.as_view()),
]