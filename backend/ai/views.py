from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from resumes.models import Resume
from .services import analyze, generate_cover_note

class MatchView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai'

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = (request.data.get('job_description') or '').strip()

        if not resume_id or not job_description:
            return Response(
                {'error': 'resume_id and job_description are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resume = Resume.objects.get(pk=resume_id, user=request.user)
        except (Resume.DoesNotExist, ValueError):
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = analyze(resume.text, job_description)
        except Exception as e:
            return Response(
                {'error': f'AI call failed: {e}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        final_score = round(0.4 * result['coverage'] + 0.6 * result['ai_score'])

        return Response({
            'final_score': final_score,
            'keyword_score': result['coverage'],
            'ai_score': result['ai_score'],
            'matched_skills': result['matched'],
            'missing_skills': result['missing'],
            'summary': result['summary'],
            'strengths': result['strengths'],
            'ai_missing_skills': [],
            'tips': result['tips'],
        })


class CoverNoteView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'ai'

    def post(self, request):
        resume_id = request.data.get('resume_id')
        job_description = (request.data.get('job_description') or '').strip()
        tone = request.data.get('tone', 'professional')

        if not resume_id or not job_description:
            return Response(
                {'error': 'resume_id and job_description are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resume = Resume.objects.get(pk=resume_id, user=request.user)
        except (Resume.DoesNotExist, ValueError):
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            note = generate_cover_note(resume.text, job_description, tone)
        except Exception as e:
            return Response(
                {'error': f'AI call failed: {e}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({'cover_note': note})