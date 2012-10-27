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
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext as _
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
from django.db.models import Q

#
# Create new card set
#
@login_required
def newSet(request):
  #Submit
  if request.method == 'POST':
    form = EditSetForm(request.POST)
    if form.is_valid():
      existing_cardset = CardSet.objects.filter(
        name = form.cleaned_data['name'], owner = request.user)
      if not len(existing_cardset):
        cardset = CardSet(name = form.cleaned_data['name'],
                          owner = request.user,
                          reintroduce_cards = \
                            form.cleaned_data['reintroduce_cards'],
                          reintroduce_cards_amount = \
                            form.cleaned_data['reintroduce_cards_amount'],
                          reintroduce_cards_frequency = \
                            form.cleaned_data['reintroduce_cards_frequency'],
                          last_reintroduced_cards = datetime.now())
        cardset.save()
        return HttpResponseRedirect(reverse('select-set-to-edit'))
      return render_to_response('error.html', {
          'message' : _('cardset-already-exists'),
          'go_back_to' : reverse('select-set-to-edit'),
          'title' : _('error'),
          'site_link_chain' : zip([], [])
        })
    else:
      return render_to_response('edit/edit_set.html', {
          'form' : EditSetForm(request.POST),
          'already_exists' : False,
          'title' : _('new-set'),
          'site_link_chain' : zip([
              reverse('centre'),
              reverse('select-set-to-edit')
            ], [
              _('centre'),
              _('edit')
            ])
        }, context_instance = RequestContext(request))
  #Form
  else:
    return render_to_response('edit/edit_set.html', {
        'form' : EditSetForm(),
        'already_exists' : False,
        'title' : 'New Set',
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit')
          ], [
            _('centre'),
            _('edit')
          ])
      }, context_instance = RequestContext(request))

#
# Edit card set
#
@login_required
def editSet(request, set_id):
  if request.method == 'POST':
    form = EditSetForm(request.POST)
    if form.is_valid():
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      cardset.name = form.cleaned_data['name']
      cardset.reintroduce_cards = form.cleaned_data['reintroduce_cards']
      cardset.reintroduce_cards_amount = \
        form.cleaned_data['reintroduce_cards_amount']
      cardset.reintroduce_cards_frequency = \
        form.cleaned_data['reintroduce_cards_frequency']
      cardset.save()
      return HttpResponseRedirect(reverse('select-set-to-edit'))
    else:
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      return render_to_response('edit/edit_set.html', {
          'form' : form,
          'already_exists' : True,
          'id' : cardset.pk,
          'title' : _('edit-set') + ': ' + cardset.name,
          'site_link_chain' : zip([
              reverse('centre'),
              reverse('select-set-to-edit')
            ], [
              _('centre'),
              _('edit')
            ])
        }, context_instance = RequestContext(request))
  else:
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    return render_to_response('edit/edit_set.html', {
        'form' : EditSetForm({
            'name' : cardset.name,
            'reintroduce_cards' : cardset.reintroduce_cards,
            'reintroduce_cards_amount' : cardset.reintroduce_cards_amount,
            'reintroduce_cards_frequency' : cardset.reintroduce_cards_frequency,
          }),
        'already_exists' : True,
        'id' : cardset.pk,
        'title' : _('edit-set') + ': ' + cardset.name,
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit')
          ], [
            _('centre'),
            _('edit')
          ])
      }, context_instance = RequestContext(request))

#
# Delete set
#
@login_required
def deleteSet(request, set_id):
  if request.method == 'POST':
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    cardset.delete()
    return render_to_response('confirmation.html', {
        'message' : _('deleted'),
        'short_messsage' : _('deleted'),
        'go_to' : reverse('centre'),
        'go_to_name' : _('back-to-centre'),
        'title' : _('confirmation'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))
  else:
    return render_to_response('error.html', {
        'message' : _('this-action-must-be-posted'),
        'go_back_to' : reverse('edit-set', args = [set_id]),
        'title' : _('error'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))

#
# View boxes within a set.
#
@login_required
def viewBoxesBySet(request, set_id):
  cardset = get_object_or_404(CardSet, pk = set_id)
  names = []
  gotos = []
  for box in cardset.cardbox_set.all():
    names.append(box.name)
    gotos.append(reverse('edit-box', args = [str(set_id), box.pk]))
  return render_to_response('edit/list_boxes.html', {
      'boxes' : cardset.cardbox_set.all(),
      'set_id' : set_id,
      'title' : _('boxes-by-set'),
      'site_link_chain' : zip([
          reverse('centre'),
          reverse('select-set-to-edit'),
          reverse('edit-set', args = [set_id])
        ], [
          _('centre'),
          _('edit'),
          _('edit-set') + ': ' + cardset.name
        ])
    }, context_instance = RequestContext(request))

#
# Edit card box
#
@login_required
def editBox(request, set_id, box_id):
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
        return HttpResponseRedirect(reverse('edit-view-boxes-by-set',
                                            args = [str(set_id)]))
      else:
        raise ValueError()
    except ValueError:
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      box = get_object_or_404(CardBox, pk = box_id, parent_card_set = cardset,
                              owner = request.user)
      return render_to_response('edit/edit_box.html', {
          'form' : EditBoxForm(request.POST),
          'already_exists' : True,
          'id' : box_id,
          'set_id' : set_id,
          'title' : _('edit-box') + ': ' + box.name,
          'site_link_chain' : zip([
              reverse('centre'),
              reverse('select-set-to-edit'),
              reverse('edit-set', args = [set_id]),
              reverse('edit-view-boxes-by-set', args= [set_id])
            ], [
              _('centre'),
              _('edit'),
              _('edit-set') + ': ' + cardset.name, _('boxes-by-set')
            ])
        }, context_instance = RequestContext(request))
  #Form
  else:
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    box = get_object_or_404(CardBox, pk = box_id, parent_card_set = cardset,
                            owner = request.user)
    return render_to_response('edit/edit_box.html', {
        'form' : EditBoxForm({
            'name' : box.name,
            'review_frequency' : box.review_frequency
          }),
        'already_exists' : True,
        'id' : box_id,
        'set_id' : set_id,
        'title' : _('edit-box') + ': ' + box.name,
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit'),
            reverse('edit-set', args = [set_id]),
            reverse('edit-view-boxes-by-set', args = [set_id])
          ], [
            _('centre'),
            _('edit'),
            _('edit-set') + ': ' + cardset.name,
            _('boxes-by-set')
          ])
      }, context_instance = RequestContext(request))

#
# Create card box
#
@csrf_exempt
@login_required
def newBox(request, set_id):
  if request.method == 'POST':
    try:
      form = EditBoxForm(request.POST)
      if form.is_valid():
        cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
        box = CardBox(name = form.cleaned_data['name'],
          owner = request.user, parent_card_set = cardset,
          review_frequency = int(form.cleaned_data['review_frequency']),
          last_reviewed = datetime.now())
        if box.review_frequency == 0:
          raise ValueError()
        box.save()
        if request.is_ajax():
          return HttpResponse('{"status" : 0}')
        else:
          return HttpResponseRedirect(reverse('select-set-to-edit'))
      else:
        raise ValueError()
    except ValueError:
      if request.is_ajax():
        return HttpResponse('{"status" : 1, "message" : "' +
                            _('ajax-form-not-valid') + '"}')
      else:
        cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
        return render_to_response('edit/edit_box.html', {
            'form' : EditBoxForm(request.POST),
            'already_exists' : False,
            'set_id' : set_id,
            'title' : _('new-box'),
            'site_link_chain' : zip([
                reverse('centre'),
                reverse('select-set-to-edit'),
                reverse('edit-set', args = [set_id])
              ], [
                _('centre'),
                _('edit'),
                _('edit-set') + ': ' + cardset.name
              ])
          }, context_instance = RequestContext(request))
  else:
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    return render_to_response('edit/edit_box.html', {
        'form' : EditBoxForm(),
        'already_exists' : False,
        'set_id' : set_id,
        'title' : _('new-box'),
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit'),
            reverse('edit-set', args = [set_id])
          ], [
            _('centre'),
            _('edit'),
            _('edit-set') + ': ' + cardset.name
          ])
      }, context_instance = RequestContext(request))

#
# Delete card box
#
@login_required
def deleteBox(request, set_id, box_id):
  if request.method == 'POST':
    box = get_object_or_404(CardBox, pk = box_id)
    box.delete()
    return render_to_response('confirmation.html', {
        'message' : _('deleted'),
        'short_messsage' : _('deleted'),
        'go_to' : reverse('edit-set', args = [set_id]),
        'go_to_name' : _('back-to-centre'),
        'title' : _('confirmation'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))
  else:
    return render_to_response('error.html', {
        'message' : _('this-action-must-be-posted'),
        'go_back_to' : reverse('edit-box', args = [set_id, box_id]),
        'title' : _('error'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))

#
# View cards within set.
#
@login_required
def viewCardsBySet(request, set_id):
  first_card = 0
  if 'first_card' in request.GET:
    try:
      first_card = int(request.GET['first_card'])
    except ValueError:
      pass
  cardset = get_object_or_404(CardSet, pk = set_id)

  #Determine which sides of cards to search
  if 'card_front' in request.GET and request.GET['card_front'] == 'on':
    query_front = True
  else:
    query_front = False
  if 'card_back' in request.GET and request.GET['card_back'] == 'on':
    query_back = True
  else:
    query_back = False

  #Get cards to display
  if 'search' in request.GET and request.GET['search'] != '':
    search = request.GET['search']
    if query_front and not query_back:
      cards = cardset.card_set.filter(front__contains = request.GET['search'])
    elif query_back and not query_front:
      cards = cardset.card_set.filter(back__contains = request.GET['search'])
    elif not query_back and not query_front:
      cards = []
    elif query_back and query_front:
      cards = cardset.card_set.filter(
        Q(front__contains = request.GET['search']) |
        Q(back__contains = request.GET['search']))
  else:
    search = ''
    cards = cardset.card_set.all()[first_card:first_card + 10]

  return render_to_response('edit/list_cards.html', {
      'cards' : cards,
      'set_id' : set_id,
      'previous_first_card' : first_card - 10 if first_card > 10 else 0,
      'current_first_card' : first_card,
      'next_first_card' : first_card + 10,
      'num_cards' : cardset.card_set.count(),
      'search' : search,
      'card_front' : 2 if ('card_front' in request.GET and
                           request.GET['card_front'] == 'on') else 1,
      'card_back' : 2 if ('card_back' in request.GET and
                          request.GET['card_back'] == 'on') else 1,
      'title' : _('cards-by-set'),
      'site_link_chain' : zip([
          reverse('centre'),
          reverse('select-set-to-edit'),
          reverse('edit-set', args = [set_id])
        ], [
          _('centre'),
          _('edit'),
          _('edit-set') + ': ' + cardset.name
        ])
    }, context_instance = RequestContext(request))

#
# Create new card
#
@csrf_exempt
@login_required
def newCard(request, set_id):
  #Submit
  if request.method == 'POST':
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    form = EditCardForm(
      CardBox.objects.filter(owner = request.user, parent_card_set = cardset),
      request.POST)
    if form.is_valid():
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      box = get_object_or_404(CardBox, pk = int(form.cleaned_data['card_box']),
                              owner = request.user, parent_card_set = cardset) \
            if int(form.cleaned_data['card_box']) != 0 else None
      card = Card(front = form.cleaned_data['front'],
                  back = form.cleaned_data['back'], owner = request.user,
                  parent_card_set = cardset, current_box = box)
      card.save()
      if request.is_ajax():
        return HttpResponse('{"status" : 0}')
      else:
        return HttpResponseRedirect(reverse('edit-set', args = [str(set_id)]))
    else:
      if request.is_ajax():
        return HttpResponse('{"status" : 1, "message" : "' +
                            _('ajax-form-not-valid') + '"}')
      else:
        return render_to_response('edit/edit_card.html', {
            'form' : form,
            'already_exists' : False,
            'set_id' : set_id,
            'title' : _('new-card'),
            'site_link_chain' : zip([
                reverse('centre'),
                reverse('select-set-to-edit'),
                reverse('edit-set', args = [set_id])
              ], [
                _('centre'),
                _('edit'),
                _('edit-set') + ': ' + cardset.name
              ])
          }, context_instance = RequestContext(request))
  #Form
  else:
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    return render_to_response('edit/edit_card.html', {
        'form' :
          EditCardForm(CardBox.objects.filter(owner = request.user,
                       parent_card_set = cardset)),
        'already_exists' : False,
        'set_id' : set_id,
        'title' : _('new-card'),
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit'),
            reverse('edit-set', args = [set_id])
          ], [
            _('centre'),
            _('edit'),
            _('edit-set') + ': ' + cardset.name
          ])
      }, context_instance = RequestContext(request))

#
# Display form with which to edit a card.
#
@login_required
def editCard(request, set_id, card_id):
  #Submit
  if request.method == 'POST':
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    form = EditCardForm(
      CardBox.objects.filter(owner = request.user, parent_card_set = cardset),
      request.POST)
    if form.is_valid():
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      card = get_object_or_404(Card, pk = card_id, owner = request.user)
      card.front = form.cleaned_data['front']
      card.back = form.cleaned_data['back']
      card.current_box = get_object_or_404(CardBox,
        pk = int(form.cleaned_data['card_box']), owner = request.user,
        parent_card_set = cardset) \
        if int(form.cleaned_data['card_box']) != 0 else None
      card.save()
      return HttpResponseRedirect(reverse('edit-view-cards-by-set',
                                          args = [str(set_id)]))
    else:
      cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
      card = get_object_or_404(Card, pk = card_id, parent_card_set = cardset,
                               owner = request.user)
      return render_to_response('edit/edit_card.html', {
          'form' :
            EditCardForm(CardBox.objects.filter(owner = request.user,
                         parent_card_set = cardset), request.POST),
          'already_exists' : True,
          'id' : card_id,
          'set_id' : set_id,
          'title' : _('edit-card'),
          'site_link_chain' : zip([
              reverse('centre'),
              reverse('select-set-to-edit'),
              reverse('edit-set', args = [set_id]),
              reverse('edit-view-cards-by-set', args = [set_id])
            ], [
              _('centre'),
              _('edit'),
              _('edit-set') + ': ' + cardset.name,
              _('cards-by-set')
            ])
        }, context_instance = RequestContext(request))
  #Form
  else:
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    card = get_object_or_404(Card, pk = card_id, parent_card_set = cardset,
                             owner = request.user)
    return render_to_response('edit/edit_card.html', {
        'form' :
          EditCardForm(CardBox.objects.filter(owner = request.user,
            parent_card_set = cardset), {
              'front' : card.front,
              'back' : card.back,
              'card_box' :
                card.current_box.pk if card.current_box != None else 0
            }),
        'already_exists' : True,
        'id' : card_id,
        'set_id' : set_id,
        'title' : _('edit-card'),
        'site_link_chain' : zip([
            reverse('centre'),
            reverse('select-set-to-edit'),
            reverse('edit-set', args = [set_id]),
            reverse('edit-view-cards-by-set', args = [set_id])
          ], [
            _('centre'),
            _('edit'),
            _('edit-set') + ': ' + cardset.name,
            _('cards-by-set')
          ])
      }, context_instance = RequestContext(request))

#
# Delete card
#
@login_required
def deleteCard(request, set_id, card_id):
  if request.method == 'POST':
    card = get_object_or_404(Card, pk = card_id, owner = request.user)
    card.delete()
    return render_to_response('confirmation.html', {
        'message' : _('deleted'),
        'short_messsage' : _('deleted'),
        'go_to' : reverse('edit-set', args = [set_id]),
        'go_to_name' : _('back-to-centre'),
        'title' : _('confirmation'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))
  else:
    return render_to_response('error.html', {
        'message' : _('this-action-must-be-posted'),
        'go_back_to' : reverse('edit-card', args = [set_id, card_id]),
        'title' : _('error'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))
