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
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
import json

#
# Process AJAX requests from mobile site
#
@login_required
def ajax(request):
  #AJAX
  if ('HTTP_X_REQUESTED_WITH' in request.META and
      request.META['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'):
    is_ajax = True
  else:
    is_ajax = False
  #Process request
  if (request.method == 'POST' and is_ajax and 'type' in request.POST and
    'params' in request.POST):
    #Get card sets by criteria
    if request.POST['type'] == 'get-cardsets':
      params = json.loads(request.POST['params'])
      params['owner'] = request.user
      results = []
      cardsets = CardSet.objects.filter(**params)
      start = request.POST['start'] if 'start' in request.POST else 0
      end = request.POST['end'] if 'end' in request.POST else len(cardsets)
      for cardset in cardsets[start:end]:
        results.append(cardset.serialize())
      return HttpResponse(json.dumps({
          'status' : 'success',
          'result' : results
        }))
    #Get card boxes by criteria
    if request.POST['type'] == 'get-cardboxes':
      params = json.loads(request.POST['params'])
      params['owner'] = request.user
      results = []
      cardboxes = CardBox.objects.filter(**params)
      start = request.POST['start'] if 'start' in request.POST else 0
      end = request.POST['end'] if 'end' in request.POST else len(cardboxes)
      for cardbox in cardboxes[start:end]:
        results.append(cardbox.serialize())
      return HttpResponse(json.dumps({
          'status' : 'success',
          'result' : results
        }))
    #Get cards by criteria
    if request.POST['type'] == 'get-cards':
      params = json.loads(request.POST['params'])
      params['owner'] = request.user
      results = []
      cards = Card.objects.filter(**params)
      start = request.POST['start'] if 'start' in request.POST else 0
      end = request.POST['end'] if 'end' in request.POST else len(cards)
      for card in cards[start:end]:
        results.append(card.serialize())
      return HttpResponse(json.dumps({
          'status' : 'success',
          'result' : results
        }))
    #Modify card set
    if request.POST['type'] == 'modify-cardset':
      params = json.loads(request.POST['params'])
      try:
        if params['id'] == None:
          cardset = CardSet(owner = request.user)
        else:
          cardset = CardSet.objects.get(pk = params['id'], owner = request.user)
        cardset.modify(params)
        cardset.save()
        return HttpResponse(json.dumps({
            'status' : 'success',
            'id' : cardset.pk
          }))
      except ObjectDoesNotExist:
        return HttpResponse(json.dumps({'status' : 'fail'}))
    #Modify card box
    if request.POST['type'] == 'modify-cardbox':
      params = json.loads(request.POST['params'])
      try:
        if params['id'] == None:
          cardbox = CardBox(owner = request.user)
        else:
          cardbox = CardBox.objects.get(pk = params['id'], owner = request.user)
        cardbox.modify(params)
        cardbox.save()
        return HttpResponse(json.dumps({
            'status' : 'success',
            'id' : cardbox.pk
          }))
      except ObjectDoesNotExist:
        return HttpResponse(json.dumps({'status' : 'fail'}))
    #Modify card
    if request.POST['type'] == 'modify-card':
      params = json.loads(request.POST['params'])
      try:
        if params['id'] == None:
          card = Card(owner = request.user)
        else:
          card = Card.objects.get(pk = params['id'], owner = request.user)
        card.modify(params)
        card.save()
        return HttpResponse(json.dumps({'status' : 'success', 'id' : card.pk}))
      except ObjectDoesNotExist:
        return HttpResponse(json.dumps({'status' : 'fail'}))
  return HttpResponse('{"status" : "fail", "message" : "Invalid POST data"}')
