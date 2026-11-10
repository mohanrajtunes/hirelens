from rest_framework import serializers

from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'file', 'text', 'uploaded_at']
        read_only_fields = ['text', 'uploaded_at']