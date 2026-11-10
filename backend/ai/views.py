from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from resumes.models import Resume
from .services import keyword_match, llm_analysis


class MatchView(APIView):
    permission_classes = [IsAuthenticated]

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

        kw_score, matched, missing = keyword_match(resume.text, job_description)

        try:
            ai = llm_analysis(resume.text, job_description)
            ai_score = max(0, min(100, int(ai.get('score', 0))))
        except Exception as e:
            return Response(
                {'error': f'AI call failed: {e}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        final_score = round(0.4 * kw_score + 0.6 * ai_score)

        return Response({
            'final_score': final_score,
            'keyword_score': kw_score,
            'ai_score': ai_score,
            'matched_skills': matched,
            'missing_skills': missing,
            'summary': ai.get('summary', ''),
            'strengths': ai.get('strengths', []),
            'ai_missing_skills': ai.get('missing_skills', []),
            'tips': ai.get('tips', []),
        })