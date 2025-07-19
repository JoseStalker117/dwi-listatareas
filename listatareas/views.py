from django.shortcuts import render, redirect
from django.http import JsonResponse
import requests
import json

def index(request):
    return render(request, 'index.html')

def login_view(request):
    return render(request, 'login.html')

def register_view(request):
    return render(request, 'register.html')

def logout_view(request):
    # Limpiar cualquier sesión de Django si es necesaria
    response = redirect('/login')
    return response