# Copyright (C) 2011 Braden Walters

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
from django.conf import settings
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext_lazy as _
from django.middleware import csrf
import json

#
# Review
#
@login_required
def run(request, set_id):
  cardset = get_object_or_404(CardSet, pk = set_id)
  study_options = {
      'set' : set_id,
      'set_name' : cardset.name
    }
  #Normal study
  if 'box' not in request.GET:
    study_options['study_type'] = 'normal'
    study_options['study_type_name'] = _('study-type-normal')
  #Study cards in no box
  elif request.GET['box'] == 'None':
    study_options['study_type'] = 'no_box'
    study_options['study_type_name'] = _('study-type-no-box')
  #Study cards in single box
  else:
    study_options['study_type'] = 'single_box'
    study_options['study_type_name'] = _('study-type-single-box')
    study_options['box'] = int(request.GET['box'])

  return render_to_response('run/review.html', {
      'csrf_token' : csrf.get_token(request),
      'site_root' : settings.FORCE_SCRIPT_NAME if
                    settings.FORCE_SCRIPT_NAME != None else '',
      'study_options' : json.dumps(study_options)
    }, context_instance = RequestContext(request))

#
# All cards finished
#
@login_required
def finished(request):
  return render_to_response('confirmation.html', {
      'message' : _('completed'),
      'short_messsage' : _('completed'),
      'go_to' : reverse('centre'),
      'go_to_name' : _('back-to-centre'),
      'title' : _('confirmation'),
      'site_link_chain' : zip([], [])
    }, context_instance = RequestContext(request))
