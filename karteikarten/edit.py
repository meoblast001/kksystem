# Copyright (C) 2011 - 2013 Braden Walters

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
import json

#
# Create new card set
#
@login_required
def newSet(request):
  #Submit
  if request.method == 'POST':
    cardset = CardSet(owner = request.user,
                      last_reintroduced_cards = datetime.now())
    form = EditSetForm(request.POST, instance = cardset)
    if form.is_valid():
      form.save()
      return HttpResponseRedirect(reverse('select-set-to-edit'))
    else:
      return render_to_response('edit/edit_set.html', {
          'form' : form,
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
  cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
  if request.method == 'POST':
    form = EditSetForm(request.POST, instance = cardset)
    if form.is_valid():
      form.save()
      return HttpResponseRedirect(reverse('select-set-to-edit'))
    else:
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
    return render_to_response('edit/edit_set.html', {
        'form' : EditSetForm(instance = cardset),
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
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    box = get_object_or_404(CardBox, pk = box_id, owner = request.user)
    form = EditBoxForm(request.POST, instance = box)
    if form.is_valid():
      form.save()
      return HttpResponseRedirect(reverse('edit-view-boxes-by-set',
                                          args = [str(set_id)]))
    else:
      return render_to_response('edit/edit_box.html', {
          'form' : form,
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
              _('edit-set') + ': ' + cardset.name,
              _('boxes-by-set')
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
    cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
    cardbox = CardBox(owner = request.user,
                      parent_card_set = cardset,
                      last_reviewed = datetime.now())
    form = EditBoxForm(request.POST, instance = cardbox)
    if form.is_valid():
      form.save()
      if request.is_ajax():
        return HttpResponse('{"status" : 0}')
      else:
        return HttpResponseRedirect(reverse('select-set-to-edit'))
    else:
      if request.is_ajax():
        return HttpResponse('{"status" : 1, "message" : "' +
                            _('ajax-form-not-valid') + '", "reasons" : ' +
                            json.dumps(form.errors) + '}')
      else:
        cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
        return render_to_response('edit/edit_box.html', {
            'form' : form,
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
    form = EditCardForm(request.POST,
      instance = Card(owner = request.user,
                      parent_card_set = CardSet(pk = set_id)))
    if form.is_valid():
      form.save()
      if request.is_ajax():
        return HttpResponse('{"status" : 0}')
      else:
        return HttpResponseRedirect(reverse('edit-set', args = [str(set_id)]))
    else:
      if request.is_ajax():
        return HttpResponse('{"status" : 1, "message" : "' +
                            _('ajax-form-not-valid') + '", "reasons" : ' +
                            json.dumps(form.errors) + '}')
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
        'form' : EditCardForm(instance =
          Card(owner = request.user, parent_card_set = CardSet(pk = set_id))),
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
  cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
  card = get_object_or_404(Card, pk = card_id, parent_card_set = cardset,
                           owner = request.user)
  #Submit
  if request.method == 'POST':
    form = EditCardForm(request.POST, instance = card)
    if form.is_valid():
      form.save()
      return HttpResponseRedirect(reverse('edit-view-cards-by-set',
                                          args = [str(set_id)]))
    else:
      return render_to_response('edit/edit_card.html', {
          'form' : EditCardForm(request.POST, instance = card),
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
    return render_to_response('edit/edit_card.html', {
        'form' : EditCardForm(instance = card),
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

#
# Import set data
#
@login_required
def setImport(request, set_id):
  cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
  if request.method == 'POST':
    #File uploaded
    if 'file' in request.FILES:
      form = SetImportForm(request.POST, request.FILES)
      if form.is_valid():
        importer = form.importData(cardset, request.user)
        return render_to_response('edit/import.html', {
            'id' : set_id,
            'importer' : importer,
            'importer_json' : json.dumps(importer.serialise()),
            'verification' : True,
            'title' : _('import'),
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
        return render_to_response('edit/import.html', {
            'id' : set_id,
            'form' : form,
            'upload_form' : True,
            'title' : _('import'),
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
    #Verified
    elif 'import_data' in request.POST:
      try:
        importer = importers.SetImporter(cardset, request.user,
          restore = json.loads(request.POST['import_data']))
        importer.save()
        return render_to_response('confirmation.html', {
            'message' : _('import-successful'),
            'go_to' : reverse('edit-set', args = [set_id]),
            'go_to_name' : _('back-to-centre'),
            'title' : _('confirmation'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
      except importers.SetImporter.ImportError:
        return render_to_response('error.html', {
            'message' : _('import-failure'),
            'go_back_to' : reverse('set-import', args = [set_id]),
            'title' : _('error'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
  else:
    return render_to_response('edit/import.html', {
        'id' : set_id,
        'form' : SetImportForm(),
        'upload_form' : True,
        'title' : _('import'),
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
# Edit set data
#
@login_required
def setExport(request, set_id):
  cardset = get_object_or_404(CardSet, pk = set_id, owner = request.user)
  if request.POST:
    form = SetExportForm(request.POST)
    if form.is_valid():
      response = HttpResponse(mimetype = 'text/plain')
      response['Content-Disposition'] = 'attachment; filename="' + \
                                        cardset.owner.username + '_' + \
                                        cardset.name + form.dataExtension() + \
                                        '"'
      response.write(form.exportData(cardset))
      return response
  else:
    form = SetExportForm()
  return render_to_response('edit/export.html', {
      'id' : set_id,
      'form' : form,
      'title' : _('export'),
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
