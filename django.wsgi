import os
import sys

ROOT_PATH = os.path.abspath(os.path.dirname(__file__))
if ROOT_PATH not in sys.path:
  sys.path.append(ROOT_PATH)

ROOT_PARENT = os.path.join(ROOT_PATH, '..')
if ROOT_PARENT not in sys.path:
  sys.path.append(ROOT_PARENT)

os.environ['DJANGO_SETTINGS_MODULE'] = 'karteikartensystem.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
