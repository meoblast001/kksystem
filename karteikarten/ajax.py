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
def Ajax(request):
	#AJAX
	if 'HTTP_X_REQUESTED_WITH' in request.META and request.META['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest':
		is_ajax = True
	else:
		is_ajax = False
	#Process request
	if request.method == 'POST' and is_ajax and 'type' in request.POST and 'params' in request.POST:
		#Get card sets by criteria
		if request.POST['type'] == 'get-cardsets':
			params = json.loads(request.POST['params'])
			params['owner'] = request.user
			results = []
			for cardset in CardSet.objects.filter(**params):
				results.append(cardset.Serialize())
			return HttpResponse(json.dumps({'status' : 'success', 'result' : results}))
		#Get card boxes by criteria
		if request.POST['type'] == 'get-cardboxes':
			params = json.loads(request.POST['params'])
			params['owner'] = request.user
			results = []
			for cardbox in CardBox.objects.filter(**params):
				results.append(cardbox.Serialize())
			return HttpResponse(json.dumps({'status' : 'success', 'result' : results}))
		#Get cards by criteria
		if request.POST['type'] == 'get-cards':
			params = json.loads(request.POST['params'])
			params['owner'] = request.user
			results = []
			for card in Card.objects.filter(**params):
				results.append(card.Serialize())
			return HttpResponse(json.dumps({'status' : 'success', 'result' : results}))
		#Modify card box
		if request.POST['type'] == 'modify-cardbox':
			params = json.loads(request.POST['params'])
			try:
				cardbox = CardBox.objects.get(pk = params['id'], owner = request.user)
				cardbox.Modify(params)
				cardbox.save()
				return HttpResponse(json.dumps({'status' : 'success'}))
			except ObjectDoesNotExist:
				return HttpResponse(json.dumps({'status' : 'fail'}))
		#Modify card
		if request.POST['type'] == 'modify-card':
			params = json.loads(request.POST['params'])
			try:
				card = Card.objects.get(pk = params['id'], owner = request.user)
				card.Modify(params)
				card.save()
				return HttpResponse(json.dumps({'status' : 'success'}))
			except ObjectDoesNotExist:
				return HttpResponse(json.dumps({'status' : 'fail'}))
	return HttpResponse('{"status" : "fail", "message" : "Invalid POST data"}')
