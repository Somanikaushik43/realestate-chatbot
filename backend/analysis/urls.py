from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload'),
    path('query/', views.query_area, name='query'),
    path('download/', views.download_filtered_csv, name='download'),
]
