from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from . import views

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('', views.index),
]
