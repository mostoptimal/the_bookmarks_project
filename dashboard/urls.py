# from django.contrib import admin
from django.urls import path #, include
from . import views

urlpatterns = [
    # path('', views.dashboard_home, name='dashboard_home'),
    # path('admin/', admin.site.urls),
    # path('', include('landing.urls')),  # Default route → Landing page
    # path('dashboard/', include('dashboard-home')),
    path('', views.index, name='dashboard-home'),  # matches /dashboard/
]
