""" # bookmarks/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='bookmarks_index'),  # Example route
]
 """

from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_bookmarks, name='upload_bookmarks'),
    path('api/bookmarks/', views.get_bookmarks, name='get_bookmarks'),
]
