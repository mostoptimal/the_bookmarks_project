# from django.db import models
from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone


class Folder(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['name', 'user', 'parent']

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color

    class Meta:
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name


class Bookmark(models.Model):
    title = models.CharField(max_length=200)
    url = models.URLField(max_length=2000)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    folder = models.ForeignKey(
        Folder, null=True, blank=True, on_delete=models.SET_NULL)
    tags = models.ManyToManyField(Tag, blank=True)
    favicon_url = models.URLField(blank=True, null=True)
    is_favorite = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['url', 'user']

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('bookmark_detail', kwargs={'pk': self.pk})
