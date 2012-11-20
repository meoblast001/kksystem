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
from django.contrib.auth.models import User

class CardSet(models.Model):
  class Meta:
    app_label = 'karteikarten'

  name = models.CharField(_('name'), max_length = 60)
  owner = models.ForeignKey(User)
  reintroduce_cards = models.BooleanField(_('reintroduce_cards'))
  reintroduce_cards_amount = models.IntegerField(
    _('amount_of_cards_to_reintroduce'), null = True, blank = True)
  reintroduce_cards_frequency = models.IntegerField(
    _('frequency_of_card_reintroduction'), null = True, blank = True)
  last_reintroduced_cards = models.DateTimeField()

  def __unicode__(self):
    return self.name

  def clean(self):
    if (self.reintroduce_cards and (self.reintroduce_cards_amount == None or
                                    self.reintroduce_cards_frequency == None)):
      raise ValidationError(_('reintroduce_cards_required_fields'))
    query = Q(name = self.name) & Q(owner = self.owner)
    if self.pk != None:
      query &= ~Q(pk = self.pk)
    if CardSet.objects.filter(query).count() > 0:
      raise ValidationError(_('cardset_with_name_already_exists'))

  #
  # Get dictionary of object
  #
  def serialize(self):
    return {'id' : self.id, 'name' : self.name, 'owner' : self.owner.id}

  #
  # Modify object from dictionary
  #
  def modify(self, params):
    if 'name' in params:
      self.name = params['name']
