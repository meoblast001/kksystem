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
from django.contrib.auth import logout
from django.http import Http404

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
	#Submit
	if request.method == 'POST':
		try:
			#404 temporarily
			raise Http404()
		except ValueError:
			return render_to_response('error.html', {'message' : 'Value of set was not an integer. Something is wrong.', 'go_back_to' : reverse('select-set-to-run'), 'title' : 'Error', 'site_link_chain' : zip([], [])}, context_instance = RequestContext(request))
	#Form
	else:
		return render_to_response('select_set.html', {'form' : SelectSetForm(CardSet.objects.filter(owner = request.user), False), 'action_url' : reverse('select-set-to-run'), 'title' : 'Study', 'site_link_chain' : zip([reverse('centre')], ['Centre'])}, context_instance = RequestContext(request))

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
	#Submit
	if request.method == 'POST':
		form = SelectSetForm(CardSet.objects.filter(owner = request.user), True, request.POST)
		if form.is_valid():
			#New card set
			if form.cleaned_data['card_set'] == 'new':
				return HttpResponseRedirect(reverse('new-set'))
			#Edit card set
			else:
				try:
					return HttpResponseRedirect(reverse('edit-set', args = [int(form.cleaned_data['card_set'])]))
				except ValueError:
					return render_to_response('error.html', {'message' : 'Value of set was not an integer. Something is wrong.', 'go_back_to' : reverse('select-set-to-edit'), 'title' : 'Error', 'site_link_chain' : zip([], [])}, context_instance = RequestContext(request))
		else:
			return render_to_response('select_set.html', {'form' : SelectSetForm(CardSet.objects.filter(owner = request.user), True), 'action_url' : reverse('select-set-to-edit'), 'title' : 'Edit', 'site_link_chain' : zip([reverse('centre')], ['Centre'])}, context_instance = RequestContext(request))
	#Form
	else:
		return render_to_response('select_set.html', {'form' : SelectSetForm(CardSet.objects.filter(owner = request.user), True), 'action_url' : reverse('select-set-to-edit'), 'title' : 'Edit', 'site_link_chain' : zip([reverse('centre')], ['Centre'])}, context_instance = RequestContext(request))
