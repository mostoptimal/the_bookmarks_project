# from django.contrib import admin

from django.contrib import admin
from .models import Bookmark, Folder, Tag


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['title', 'url', 'user',
                    'folder', 'is_favorite', 'created_at']
    list_filter = ['is_favorite', 'is_private', 'created_at', 'folder']
    search_fields = ['title', 'url', 'description']
    filter_horizontal = ['tags']


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'parent', 'created_at']
    list_filter = ['created_at']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color']
    list_filter = ['user']
