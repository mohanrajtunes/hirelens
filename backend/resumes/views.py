from django.conf import settings
from pypdf import PdfReader
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Resume
from .serializers import ResumeSerializer


class ResumeListUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_throttles(self):
        # Only uploads are rate limited, listing is not.
        self.throttle_scope = 'upload' if self.request.method == 'POST' else None
        return super().get_throttles()

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).order_by('-uploaded_at')
        return Response(ResumeSerializer(resumes, many=True).data)

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files allowed'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > settings.MAX_RESUME_BYTES:
            return Response({'error': 'PDF is too large. The limit is 2 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        # A real PDF starts with %PDF-, whatever the file is named.
        if file.read(5) != b'%PDF-':
            return Response({'error': 'That file is not a real PDF'}, status=status.HTTP_400_BAD_REQUEST)
        file.seek(0)

        try:
            reader = PdfReader(file)
            text = '\n'.join((page.extract_text() or '') for page in reader.pages)
        except Exception:
            return Response({'error': 'Could not read PDF'}, status=status.HTTP_400_BAD_REQUEST)

        if not text.strip():
            return Response({'error': 'No text found in PDF (scanned file?)'}, status=status.HTTP_400_BAD_REQUEST)

        file.seek(0)
        resume = Resume.objects.create(user=request.user, file=file, text=text)
        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)


class ResumeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResumeSerializer(resume).data)

    def delete(self, request, pk):
        deleted, _ = Resume.objects.filter(pk=pk, user=request.user).delete()
        if not deleted:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)