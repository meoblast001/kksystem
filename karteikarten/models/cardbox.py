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

from django.db import models
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ValidationError
from cardset import CardSet
from django.contrib.auth.models import User
from datetime import datetime
import time

class CardBox(models.Model):
  class Meta:
    app_label = 'karteikarten'
    ordering = ('id',)

  def greaterThanZeroValidator(value):
    if value is not None and value <= 0:
      raise ValidationError(_('value-must-be-greater-than-zero'))
    return value

  name = models.CharField(_('name'), max_length = 60)
  owner = models.ForeignKey(User)
  parent_card_set = models.ForeignKey(CardSet)
  review_frequency = models.IntegerField(_('review-frequency-in-days'),
    validators = [greaterThanZeroValidator])
  last_reviewed = models.DateTimeField()

  def __unicode__(self):
    return self.name

  def clean(self):
    query = Q(name = self.name) & Q(owner = self.owner) & \
            Q(parent_card_set = self.parent_card_set.pk)
    if self.pk != None:
      query &= ~Q(pk = self.pk)

    if CardBox.objects.filter(query).count() > 0:
      raise ValidationError(_('cardbox-with-name-already-exists'))

  #
  # Returns a dictionary of all card boxes in an array of card sets.
  #
  @staticmethod
  def getBoxesBySets(cardsets):
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
  def serialize(self):
    return {
        'id' : self.id,
        'name' : self.name,
        'owner' : self.owner_id,
        'parent_card_set' : self.parent_card_set_id,
        'review_frequency' : self.review_frequency,
        'last_reviewed' : time.mktime(self.last_reviewed.timetuple())
      }

  #
  # Modify object from dictionary.
  #
  def modify(self, params):
    if 'name' in params:
      self.name = params['name']
    if 'parent_card_set' in params:
      self.parent_card_set_id = params['parent_card_set']
    if 'review_frequency' in params:
      self.review_frequency = params['review_frequency']
    if 'last_reviewed' in params:
      self.last_reviewed = \
        datetime.fromtimestamp(float(params['last_reviewed']))
