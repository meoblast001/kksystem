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
from forms import *
from django.conf import settings
from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponseRedirect
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.contrib.auth import logout
from django.http import Http404
import json

#
# Main menu.
#
@login_required
def centre(request):
  return render_to_response('centre.html', {},
                            context_instance = RequestContext(request))

#
# Documentation.
#
def documentation(request):
  return render_to_response('documentation.html', {
      'title' : _('documentation'),
      'site_link_chain' : zip([reverse('centre')], [_('centre')])
    }, context_instance = RequestContext(request))

#
# Select card set to run.
#
@login_required
def selectRunOptions(request):
  #Submit
  if request.method == 'POST':
    cardsets = CardSet.objects.filter(owner = request.user)
    cardset = get_object_or_404(CardSet, pk = request.POST['card_set'],
                                owner = request.user)
    cardboxes = CardBox.objects.filter \
      (parent_card_set = get_object_or_404(cardset,
                                           pk = request.POST['card_set']))
    form = RunOptionsForm(cardsets, cardboxes, request.POST)
    if form.is_valid():
      try:
        if form.cleaned_data['study_type'] == 'normal':
          return HttpResponseRedirect(reverse('run-start',
            args = [int(form.cleaned_data['card_set'])]))
        elif form.cleaned_data['study_type'] == 'single_box':
          return HttpResponseRedirect(reverse('run-start',
            args = [int(form.cleaned_data['card_set'])]) +
            '?box=' + form.cleaned_data['card_box'])
        elif form.cleaned_data['study_type'] == 'no_box':
          return HttpResponseRedirect(reverse('run-start',
            args = [int(form.cleaned_data['card_set'])]) + '?box=None')
        else:
          raise ValueError()
      except ValueError:
        return render_to_response('error.html', {
            'message' : _('something-wrong'),
            'go_back_to' : reverse('select-run-options'),
            'title' : _('error'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
    else:
      boxes_in_sets = CardBox.getBoxesBySets(cardsets)
      return render_to_response('run/run_options.html', {
          'form' : form,
          'boxes_in_sets' : json.dumps(boxes_in_sets),
          'title' : _('study'),
          'site_link_chain' : zip([reverse('centre')], [_('centre')])
        }, context_instance = RequestContext(request))
  #Form
  else:
    cardsets = CardSet.objects.filter(owner = request.user)
    boxes_in_sets = CardBox.getBoxesBySets(cardsets)
    return render_to_response('run/run_options.html', {
        'form' : RunOptionsForm(cardsets, {}),
        'boxes_in_sets' : json.dumps(boxes_in_sets),
        'title' : _('study'),
        'site_link_chain' : zip([reverse('centre')], [_('centre')])
      }, context_instance = RequestContext(request))

#
# Select card set to edit.
#
@login_required
def selectSetToEdit(request):
  #Submit
  if request.method == 'POST':
    form = SelectSetForm(CardSet.objects.filter(owner = request.user), True,
                         request.POST)
    if form.is_valid():
      #New card set
      if form.cleaned_data['card_set'] == 'new':
        return HttpResponseRedirect(reverse('new-set'))
      #Edit card set
      else:
        try:
          return HttpResponseRedirect(reverse('edit-set',
            args = [int(form.cleaned_data['card_set'])]))
        except ValueError:
          return render_to_response('error.html', {
              'message' : _('something-wrong'),
              'go_back_to' : reverse('select-set-to-edit'),
              'title' : _('error'),
              'site_link_chain' : zip([], [])
            }, context_instance = RequestContext(request))
    else:
      return render_to_response('select_set.html', {
          'form' : SelectSetForm(CardSet.objects.filter(owner = request.user),
                                 True),
          'action_url' : reverse('select-set-to-edit'),
          'title' : _('edit'),
          'site_link_chain' : zip([reverse('centre')], [_('centre')])
        }, context_instance = RequestContext(request))
  #Form
  else:
    return render_to_response('select_set.html', {
        'form' : SelectSetForm(CardSet.objects.filter(owner = request.user),
                               True),
        'action_url' : reverse('select-set-to-edit'),
        'title' : _('edit'),
        'site_link_chain' : zip([reverse('centre')], [_('centre')])
      }, context_instance = RequestContext(request))
