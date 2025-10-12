from django.shortcuts import render, redirect
# from django.contrib.auth.decorators import login_required  # Comment this out
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
import json
from .models import Bookmark, Folder, Tag
from .forms import BulkBookmarkUploadForm

# @login_required  # Comment this out


@csrf_exempt
def upload_bookmarks(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bookmarks_data = data.get('bookmarks', [])

            # Use a default user for now (create one if needed)
            user, created = User.objects.get_or_create(
                username='default_user',
                defaults={'email': 'default@example.com'}
            )

            created_count = 0
            for bookmark_data in bookmarks_data:
                # Get or create folder
                folder = None
                if bookmark_data.get('folder'):
                    folder, _ = Folder.objects.get_or_create(
                        name=bookmark_data['folder'],
                        user=user
                    )

                # Create bookmark (avoid duplicates)
                bookmark, created = Bookmark.objects.get_or_create(
                    url=bookmark_data['url'],
                    user=user,
                    defaults={
                        'title': bookmark_data.get('title', ''),
                        'folder': folder,
                        'favicon_url': bookmark_data.get('favicon')
                    }
                )

                if created:
                    created_count += 1

            return JsonResponse({
                'success': True,
                'message': f'Successfully imported {created_count} new bookmarks'
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# @login_required  # Comment this out


def get_bookmarks(request):
    # Use the default user
    user, created = User.objects.get_or_create(
        username='default_user',
        defaults={'email': 'default@example.com'}
    )

    bookmarks = Bookmark.objects.filter(user=user).select_related('folder')
    data = []

    for bookmark in bookmarks:
        data.append({
            'id': bookmark.id,
            'title': bookmark.title,
            'url': bookmark.url,
            'folder': bookmark.folder.name if bookmark.folder else 'Root',
            'favicon': bookmark.favicon_url,
            'created_at': bookmark.created_at.isoformat()
        })

    return JsonResponse({'bookmarks': data})
