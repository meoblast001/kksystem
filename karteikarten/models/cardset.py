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
from django.contrib.auth.models import User

class CardSet(models.Model):
  class Meta:
    app_label = 'karteikarten'

  name = models.CharField(max_length = 60)
  owner = models.ForeignKey(User)

  def __unicode__(self):
    return self.name

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
