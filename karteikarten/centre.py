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
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.contrib.auth import logout

#
# Main menu.
#
@login_required
def Centre(request):
	return render_to_response('centre.html', {}, context_instance = RequestContext(request))

#
# Select card set to run.
#
@login_required
def SelectSetToRun(request):
	cardsets = CardSet.objects.filter(owner = request.user)
	names = []
	gotos = []

	run_action = 'start'
	url_append = ''
	#Find strings to append to URL
	if 'box' in request.GET:
		url_append = '?box=' + request.GET['box']
		if request.GET['box'] == 'specific':
			run_action = 'select_box'

	for cardset in cardsets:
		names.append(cardset.name)
		if run_action == 'start':
			gotos.append(reverse('run-start', args = [str(cardset.pk)]) + url_append)
		else:
			gotos.append(reverse('select-set-box-to-run', args = [str(cardset.pk)]) + url_append)
	return render_to_response('menu.html', {'menu_title' : 'Select Set', 'menu_list' : zip(names, gotos)}, context_instance = RequestContext(request))

#
# Select box within set to run.
#
@login_required
def SelectSetBoxToRun(request, set_id):
	cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
	cardboxes = CardBox.objects.filter(parent_card_set = cardset)
	names = []
	gotos = []

	for cardbox in cardboxes:
		names.append(cardbox.name)
		gotos.append(reverse('run-start', args = [str(set_id)]) + '?box=' + str(cardbox.pk))
	return render_to_response('menu.html', {'menu_title' : 'Select Box', 'menu_list' : zip(names, gotos)}, context_instance = RequestContext(request))

#
# Select card set to edit.
#
@login_required
def SelectSetToEdit(request):
	cardsets = CardSet.objects.filter(owner = request.user)
	names = ['[Create New Cardset]']
	gotos = [reverse('new-set')]
	for cardset in cardsets:
		names.append(cardset.name)
		gotos.append(reverse('edit-set', args = [str(cardset.pk)]))
	return render_to_response('menu.html', {'menu_title' : 'Select Set', 'menu_list' : zip(names, gotos)}, context_instance = RequestContext(request))
