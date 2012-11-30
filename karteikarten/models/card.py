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
from django.utils.translation import ugettext_lazy as _
from cardset import CardSet
from cardbox import CardBox
from django.contrib.auth.models import User

class Card(models.Model):
  class Meta:
    app_label = 'karteikarten'

  front = models.TextField(_('front'))
  back = models.TextField(_('back'))
  owner = models.ForeignKey(User)
  parent_card_set = models.ForeignKey(CardSet)
  current_box = models.ForeignKey(CardBox, blank = True, null = True,
                                  related_name = _('card-box'))

  def __unicode__(self):
    return self.front

  #
  # Get dictionary of object
  #
  def serialize(self):
    return {
        'id' : self.id,
        'front' : self.front,
        'back' : self.back,
        'owner' : self.owner_id,
        'parent_card_set' : self.parent_card_set_id,
        'current_box' : self.current_box_id
      }

  #
  # Modify object from dictionary.
  #
  def modify(self, params):
    if 'front' in params:
      self.front = params['front']
    if 'back' in params:
      self.back = params['back']
    if 'parent_card_set' in params:
      self.parent_card_set_id = params['parent_card_set']
    if 'current_box' in params:
      self.current_box_id = params['current_box']
