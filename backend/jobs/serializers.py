from rest_framework import serializers

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            'id', 'company', 'role', 'link', 'job_description', 'status',
            'match_score', 'cover_note', 'notes', 'applied_date',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']