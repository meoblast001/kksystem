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

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class CardSet(models.Model):
	name = models.CharField(max_length = 60)
	owner = models.ForeignKey(User)

	def __unicode__(self):
		return self.name

	#
	# Get dictionary of object
	#
	def Serialize(self):
		return {'id' : self.id, 'name' : self.name, 'owner' : self.owner.id}

	#
	# Modify object from dictionary
	#
	def Modify(self, params):
		if 'name' in params:
			self.name = params['name']
		if 'owner' in params:
			self.owner_id = params['owner']

class CardBox(models.Model):
	name = models.CharField(max_length = 60)
	owner = models.ForeignKey(User)
	parent_card_set = models.ForeignKey(CardSet)
	review_frequency = models.IntegerField()
	last_reviewed = models.DateTimeField()

	def __unicode__(self):
		return self.name

	#
	# Returns a dictionary of all card boxes in an array of card sets.
	#
	@staticmethod
	def GetBoxesBySets(cardsets):
		output = {}
		for cardset in cardsets:
			boxes = []
			for cardbox in cardset.cardbox_set.all():
				boxes.append({'id' : cardbox.pk, 'name' : cardbox.name})
			output.update({cardset.pk : boxes})
		return output

	#
	# Get dictionary of object
	#
	def Serialize(self):
		return {'id' : self.id, 'name' : self.name, 'owner' : self.owner_id, 'parent_card_set' : self.parent_card_set_id, 'review_frequency' : self.review_frequency, 'last_reviewed' : str(self.last_reviewed)}

	#
	# Modify object from dictionary.
	#
	def Modify(self, params):
		if 'name' in params:
			self.name = params['name']
		if 'owner' in params:
			self.owner_id = params['owner']
		if 'parent_card_set' in params:
			self.parent_card_set_id = params['parent_card_set']
		if 'review_frequency' in params:
			self.review_frequency = params['review_frequency']
		if 'last_reviewed' in params:
			self.last_reviewed = datetime.fromtimestamp(float(params['last_reviewed']))

class Card(models.Model):
	front = models.TextField()
	back = models.TextField()
	owner = models.ForeignKey(User)
	parent_card_set = models.ForeignKey(CardSet)
	current_box = models.ForeignKey(CardBox, blank = True, null = True)

	def __unicode__(self):
		return self.front

	#
	# Get dictionary of object
	#
	def Serialize(self):
		return {'id' : self.id, 'front' : self.front, 'back' : self.back, 'owner' : self.owner_id, 'parent_card_set' : self.parent_card_set_id, 'current_box' : self.current_box_id}

	#
	# Modify object from dictionary.
	#
	def Modify(self, params):
		if 'front' in params:
			self.front = params['front']
		if 'back' in params:
			self.back = params['back']
		if 'owner' in params:
			self.owner_id = params['owner']
		if 'parent_card_set' in params:
			self.parent_card_set_id = params['parent_card_set']
		if 'current_box' in params:
			self.current_box_id = params['current_box']
