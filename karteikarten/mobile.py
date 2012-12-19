# Copyright (C) 2012 Braden Walters

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from models import *
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.middleware import csrf
import os

#
# Display mobile site
#
def mobile(request):
  return render_to_response('mobile.html', {
      'site_root' : settings.FORCE_SCRIPT_NAME if
                    settings.FORCE_SCRIPT_NAME != None else '',
      'csrf_token' : csrf.get_token(request),
      'debug' : settings.DEBUG and 'NO_DEBUG' not in request.GET,
    }, context_instance = RequestContext(request))

#
# Generate cache manifest
#
def cacheManifest(request):
  site_root = settings.FORCE_SCRIPT_NAME if \
              settings.FORCE_SCRIPT_NAME != None else ''

  cache_files = [site_root + reverse('mobile')]
  for filename in os.listdir(os.path.abspath(os.path.dirname(__file__)) + \
                             '/../static/common/'):
    cache_files.append(settings.STATIC_URL + 'common/' + filename)
  for filename in os.listdir(os.path.abspath(os.path.dirname(__file__)) + \
                             '/../static/mobile/'):
    cache_files.append(settings.STATIC_URL + 'mobile/' + filename)

  manifest_text = 'CACHE MANIFEST\n\n'
  for filename in cache_files:
    manifest_text += filename + '\n'

  return HttpResponse(manifest_text, content_type = 'text/cache-manifest')
