from django import forms
from .models import Bookmark, Folder, Tag


class BookmarkForm(forms.ModelForm):
    class Meta:
        model = Bookmark
        fields = ['title', 'url', 'description', 'folder', 'tags']


class BulkBookmarkUploadForm(forms.Form):
    bookmarks_data = forms.CharField(widget=forms.HiddenInput())

    def clean_bookmarks_data(self):
        import json
        data = self.cleaned_data['bookmarks_data']
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            raise forms.ValidationError("Invalid bookmark data format")
