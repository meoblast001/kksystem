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
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from datetime import datetime

#
# Set up for review
#
@login_required
def Start(request, set_id):
	cardboxes_to_review = []
	cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
	cardboxes = cardset.cardbox_set.all().order_by('-review_frequency')
	if 'box' in request.GET:
		if request.GET['box'] != 'None':
			try:
				cardboxes_to_review.append(int(request.GET['box']))
			except ValueError:
				return render_to_response('error.html', {'message' : 'Box is not an integer.', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))
	else:
		for cardbox in cardboxes:
			diff = datetime.now() - cardbox.last_reviewed
			#If time between now and last review time is more than 6 hours before the review frequency
			if (diff.days * 24) + (diff.seconds / 3600) >= (cardbox.review_frequency * 24) - 6:
				cardboxes_to_review.append(cardbox.pk) #Review this cardbox

	request.session['cardset'] = set_id #ID of cardset that will be reviewed
	request.session['cardboxes'] = cardboxes_to_review #IDs of cardboxes that will be reviewed
	request.session['cur_cardbox_index'] = 0 #Index into array, representing the ID of the current cardbox
	request.session['cards_reviewed'] = [] #IDs of cards already reviewed

	if 'box' in request.GET:
		return HttpResponseRedirect(reverse('run-run') + '?box=' + request.GET['box'])
	return HttpResponseRedirect(reverse('run-run'))

#
# Review a card
#
@login_required
def Run(request):
	if 'box' in request.GET:
		return RunSpecificBox(request)

	try:
		cardset = request.session['cardset']
		cardboxes = request.session['cardboxes']
		cur_cardbox_index = request.session['cur_cardbox_index']
		cards_reviewed = request.session['cards_reviewed']
		if len(cardboxes) < 1:
			raise KeyError
	except KeyError:
		return render_to_response('error.html', {'message' : 'Review session has expired', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))

	cur_cardbox = get_object_or_404(CardBox, pk = cardboxes[cur_cardbox_index])
	cards = Card.objects.filter(current_box = cur_cardbox).order_by('?')
	for card in cards:
		if card.pk not in cards_reviewed:
			return render_to_response('review.html', {'card' : card, 'card_box' : cur_cardbox, 'card_set' : cur_cardbox.parent_card_set, 'url_append' : ''}, context_instance = RequestContext(request))

	#Update review time on current box
	cur_cardbox.last_reviewed = datetime.now()
	cur_cardbox.save()
	if cur_cardbox_index + 1 < len(cardboxes):
		#Advance to next cardbox
		request.session['cur_cardbox_index'] = cur_cardbox_index + 1
		return Run(request)
	else:
		#Finished
		return HttpResponseRedirect(reverse('run-finished'))

#
# Review a card from a specific box
#
@login_required
def RunSpecificBox(request):
	#Get box to run
	current_box = None
	if 'box' in request.GET:
		try:
			current_box_id = int(request.GET['box'])
			current_box = get_object_or_404(CardBox, pk = current_box_id, owner = request.user)
		except ValueError:
			#Box must be set to "None"; Assume so
			pass
	else:
		return render_to_response('error.html', {'app_root' : settings.APP_ROOT, 'message' : 'No card box specified', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))

	try:
		cardset_id = request.session['cardset']
		cards_reviewed = request.session['cards_reviewed']
	except KeyError:
		return render_to_response('error.html', {'message' : 'Review session has expired', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))

	cardset = get_object_or_404(CardSet, pk = cardset_id, owner = request.user)
	cards = cardset.card_set.filter(current_box = current_box).order_by('?')

	for card in cards:
		if card.pk not in cards_reviewed:
			return render_to_response('review.html', {'card' : card, 'card_box' : current_box, 'card_set' : cardset, 'url_append' : '?box=' + request.GET['box']}, context_instance = RequestContext(request))
	return HttpResponseRedirect(reverse('run-finished'))

#
# Card was correct
#
@login_required
def Correct(request, card_id):
	if 'box' in request.GET:
		url_append = '?box=' + request.GET['box']
	else:
		url_append = ''

	try:
		cards_reviewed = request.session['cards_reviewed']
	except KeyError:
		return render_to_response('error.html', {'message' : 'Review session has expired', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))
	#Card reviewed
	cards_reviewed.append(int(card_id))
	request.session['cards_reviewed'] = cards_reviewed

	if 'box' not in request.GET: #Only update card status if not reviewing a specific box
		card = get_object_or_404(Card, pk = card_id, owner = request.user)
		card_set = card.parent_card_set
		cardboxes = CardBox.objects.filter(owner = request.user, parent_card_set = card_set).order_by('review_frequency')
		to_cardbox = None
		for i in range(len(cardboxes)):
			if cardboxes[i] == card.current_box:
				if i + 1 < len(cardboxes):
					to_cardbox = cardboxes[i + 1]
		if to_cardbox == None:
			#No available box, move card out of card boxes
			card.current_box = None
			card.save()
			return HttpResponseRedirect(reverse('run-run') + url_append)
		card.current_box = to_cardbox
		card.save()
	return HttpResponseRedirect(reverse('run-run') + url_append)

#
# Card was incorrect
#
@login_required
def Incorrect(request, card_id):
	if 'box' in request.GET:
		url_append = '?box=' + request.GET['box']
	else:
		url_append = ''

	try:
		cards_reviewed = request.session['cards_reviewed']
	except KeyError:
		return render_to_response('error.html', {'message' : 'Review session has expired', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))
	#Card reviewed
	cards_reviewed.append(int(card_id))
	request.session['cards_reviewed'] = cards_reviewed

	if 'box' not in request.GET or request.GET['box'] == 'None': #Only update card status if not reviewing a specific box or if reviewing cards from no box
		card = get_object_or_404(Card, pk = card_id, owner = request.user)
		card_set = card.parent_card_set
		cardboxes = CardBox.objects.filter(owner = request.user, parent_card_set = card_set).order_by('review_frequency')
		if not len(cardboxes):
			return render_to_response('error.html', {'message' : 'There are no cardboxes. Cannot move card to first box.', 'go_back_to' : reverse('run-run') + url_append}, context_instance = RequestContext(request))
		card.current_box = cardboxes[0]
		card.save()
	return HttpResponseRedirect(reverse('run-run') + url_append)

#
# All cards finished
#
@login_required
def Finished(request):
	return render_to_response('confirmation.html', {'message' : 'Completed.', 'short_messsage' : 'Completed', 'go_to' : reverse('centre'), 'go_to_name' : 'Back to Centre'}, context_instance = RequestContext(request))
