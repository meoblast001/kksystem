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
from django.template import RequestContext
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from datetime import datetime

#
# Create new card set
#
@login_required
def NewSet(request):
	#Submit
	if request.method == 'POST':
		form = EditSetForm(request.POST)
		if form.is_valid():
			existing_cardset = CardSet.objects.filter(name = form.cleaned_data['name'], owner = request.user)
			if not len(existing_cardset):
				cardset = CardSet(name = form.cleaned_data['name'], owner = request.user)
				cardset.save()
				return HttpResponseRedirect(reverse('select-set-to-edit'))
			return render_to_response('error.html', {'message' : 'Failed to create cardset. Already exists.', 'go_back_to' : reverse('select-set-to-edit')})
		else:
			return render_to_response('edit_set.html', {'form' : EditSetForm(request.POST), 'already_exists' : False}, context_instance = RequestContext(request))
	#Form
	else:
		return render_to_response('edit_set.html', {'form' : EditSetForm(), 'already_exists' : False}, context_instance = RequestContext(request))

#
# Edit card set
#
@login_required
def EditSet(request, set_id):
	if request.method == 'POST':
		form = EditSetForm(request.POST)
		if form.is_valid():
			cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
			cardset.name = form.cleaned_data['name']
			cardset.save()
			return HttpResponseRedirect(reverse('select-set-to-edit'))
		else:
			cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
			return render_to_response('edit_set.html', {'form' : EditSetForm(request.POST), 'already_exists' : True, 'id' : cardset.pk}, context_instance = RequestContext(request))
	else:
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		return render_to_response('edit_set.html', {'form' : EditSetForm({'name' : cardset.name}), 'already_exists' : True, 'id' : cardset.pk}, context_instance = RequestContext(request))

#
# View boxes within a set.
#
@login_required
def ViewBoxesBySet(request, set_id):
	cardset = get_object_or_404(CardSet, pk = set_id)
	names = []
	gotos = []
	for box in cardset.cardbox_set.all():
		names.append(box.name)
		gotos.append(reverse('edit-box', args = [str(set_id), box.pk]))
	return render_to_response('menu.html', {'menu_title' : 'Boxes by Set', 'menu_list' : zip(names, gotos)}, context_instance = RequestContext(request))

#
# Edit card box
#
@login_required
def EditBox(request, set_id, box_id):
	#Submit
	if request.method == 'POST':
		try:
			form = EditBoxForm(request.POST)
			if form.is_valid():
				box = get_object_or_404(CardBox, pk = box_id)
				box.name = form.cleaned_data['name']
				box.review_frequency = int(form.cleaned_data['review_frequency'])
				if box.review_frequency == 0:
					raise ValueError()
				box.save()
				return HttpResponseRedirect(reverse('edit-view-boxes-by-set', args = [str(set_id)]))
			else:
				raise ValueError()
		except ValueError:
			cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
			box = get_object_or_404(CardBox, pk = box_id, parent_card_set = cardset, owner = request.user)
			return render_to_response('edit_box.html', {'form' : EditBoxForm(request.POST), 'already_exists' : True, 'id' : box_id, 'set_id' : set_id,}, context_instance = RequestContext(request))
	#Form
	else:
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		box = get_object_or_404(CardBox, pk = box_id, parent_card_set = cardset, owner = request.user)
		return render_to_response('edit_box.html', {'form' : EditBoxForm({'name' : box.name, 'review_frequency' : box.review_frequency}), 'already_exists' : True, 'id' : box_id, 'set_id' : set_id,}, context_instance = RequestContext(request))

#
# Create card box
#
@login_required
def NewBox(request, set_id):
	if request.method == 'POST':
		try:
			form = EditBoxForm(request.POST)
			if form.is_valid():
				cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
				box = CardBox(name = form.cleaned_data['name'], owner = request.user, parent_card_set = cardset, review_frequency = int(form.cleaned_data['review_frequency']), last_reviewed = datetime.now())
				if box.review_frequency == 0:
					raise ValueError()
				box.save()
				return HttpResponseRedirect(reverse('select-set-to-edit'))
			else:
				raise ValueError()
		except ValueError:
			return render_to_response('edit_box.html', {'form' : EditBoxForm(request.POST), 'already_exists' : False, 'set_id' : set_id}, context_instance = RequestContext(request))
	else:
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		return render_to_response('edit_box.html', {'form' : EditBoxForm(), 'already_exists' : False, 'set_id' : set_id}, context_instance = RequestContext(request))

#
# View cards within set.
#
@login_required
def ViewCardsBySet(request, set_id):
	first_card = 0
	if 'first_card' in request.GET:
		try:
			first_card = int(request.GET['first_card'])
		except ValueError:
			pass
	cardset = get_object_or_404(CardSet, pk = set_id)
	names = []
	gotos = []
	for card in cardset.card_set.all()[first_card:first_card + 10]:
		names.append(card.front)
		gotos.append(reverse('edit-card', args = [str(set_id), str(card.pk)]))
	return render_to_response('list_cards.html', {'menu_title' : 'Cards by Set', 'menu_list' : zip(names, gotos), 'set_id' : set_id, 'previous_first_card' : first_card - 10 if first_card > 10 else 0, 'current_first_card' : first_card, 'next_first_card' : first_card + 10, 'num_cards' : cardset.card_set.count(), 'card_front' : 0, 'card_back' : 0}, context_instance = RequestContext(request))

#
# View cards searched within a set.
#
@login_required
def SearchCardsBySet(request, set_id):
	if 'search' in request.GET and request.GET['search'] != '':
		first_card = 0
		if 'first_card' in request.GET:
			try:
				first_card = int(request.GET['first_card'])
			except ValueError:
				pass
		cardset = get_object_or_404(CardSet, pk = set_id)
		names = []
		gotos = []
		retrieved_cards = []
		if 'card_front' in request.GET and request.GET['card_front'] == 'on':
			for card in cardset.card_set.filter(front__contains = request.GET['search']):
				names.append(card.front)
				gotos.append(reverse('edit-card', args = [str(set_id), str(card.pk)]))
				retrieved_cards.append(card.pk)
		if 'card_back' in request.GET and request.GET['card_back'] == 'on':
			for card in cardset.card_set.filter(back__contains = request.GET['search']):
				if card.pk not in retrieved_cards: #Do not get duplicates
					names.append(card.front)
					gotos.append(reverse('edit-card', args = [str(set_id), str(card.pk)]))
					retrieved_cards.append(card.pk)
		return render_to_response('list_cards.html', {'menu_title' : 'Search Cards by Set', 'menu_list' : zip(names, gotos), 'set_id' : set_id, 'previous_first_card' : first_card - 10 if first_card > 10 else 0, 'current_first_card' : first_card, 'next_first_card' : first_card + 10, 'num_cards' : len(names), 'search' : request.GET['search'], 'card_front' : 2 if ('card_front' in request.GET and request.GET['card_front'] == 'on') else 1, 'card_back' : 2 if ('card_back' in request.GET and request.GET['card_back'] == 'on') else 1}, context_instance = RequestContext(request))
	else:
		return render_to_response('error.html', {'message' : 'No box data was provided.', 'go_back_to' : reverse('select-set-to-edit')}, context_instance = RequestContext(request))

#
# Create new card
#
@login_required
def NewCard(request, set_id):
	#Submit
	if request.method == 'POST':
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		form = EditCardForm(CardBox.objects.filter(owner = request.user, parent_card_set = cardset), None, request.POST)
		if form.is_valid():
			cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
			box = get_object_or_404(CardBox, pk = int(form.cleaned_data['card_box']), owner = request.user, parent_card_set = cardset) if int(form.cleaned_data['card_box']) != 0 else None
			card = Card(front = form.cleaned_data['front'], back = form.cleaned_data['back'], owner = request.user, parent_card_set = cardset, current_box = box)
			card.save()
			return HttpResponseRedirect(reverse('edit-set', args = [str(set_id)]))
		else:
			return render_to_response('edit_card.html', {'form' : form, 'already_exists' : False, 'set_id' : set_id}, context_instance = RequestContext(request))
	#Form
	else:
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		return render_to_response('edit_card.html', {'form' : EditCardForm(CardBox.objects.filter(owner = request.user, parent_card_set = cardset), None), 'already_exists' : False, 'set_id' : set_id}, context_instance = RequestContext(request))

#
# Display form with which to edit a card.
#
@login_required
def EditCard(request, set_id, card_id):
	cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
	card = get_object_or_404(Card, pk = card_id, parent_card_set = cardset, owner = request.user)
	return render_to_response('edit_card.html', {'already_exists' : True, 'current_box' : card.current_box.pk if card.current_box != None else 'no_box', 'id' : card_id, 'set_id' : set_id, 'front' : card.front, 'back' : card.back, 'card_boxes' : CardBox.objects.filter(owner = request.user, parent_card_set = cardset)}, context_instance = RequestContext(request))

#
# Submit changes to card.
#
@login_required
def EditCardSubmit(request, set_id, card_id):
	if 'front' in request.POST and request.POST['front'] != '' and 'back' in request.POST and request.POST['back'] != '' and 'card_box' in request.POST:
		cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
		card = get_object_or_404(Card, pk = card_id, owner = request.user)
		card.front = request.POST['front']
		card.back = request.POST['back']
		card.current_box = get_object_or_404(CardBox, pk = int(request.POST['card_box']), owner = request.user, parent_card_set = cardset) if int(request.POST['card_box']) != 0 else None
		card.save()
		return HttpResponseRedirect(reverse('edit-view-cards-by-set', args = [str(set_id)]))

#
# Delete card
#
@login_required
def DeleteCard(request, set_id, card_id):
	card = get_object_or_404(Card, pk = card_id, owner = request.user)
	card.delete()
	return HttpResponseRedirect(reverse('edit-view-cards-by-set', args = [str(set_id)]))
