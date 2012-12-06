import os
import sys

ROOT_PATH = os.path.abspath(os.path.dirname(__file__))
if ROOT_PATH not in sys.path:
  sys.path.append(ROOT_PATH)

os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
