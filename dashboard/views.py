from django.shortcuts import render

def index(request):

    #    return HttpResponse("Welcome to the Dashboard")
    return render(request, 'dashboard/index.html')
