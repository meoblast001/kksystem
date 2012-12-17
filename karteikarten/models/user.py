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

from django.contrib.auth import models
from django.utils.translation import ugettext as _
from django.core.exceptions import ValidationError
from django.db.models import Q

class User(models.User):
  class Meta:
    proxy = True

  def clean(self):
    super(User, self).clean()
    #User must have unique email
    query = Q(email = self.email)
    if self.pk != None:
      query &= ~Q(pk = self.pk)
    if User.objects.filter(query).count() > 0:
      raise ValidationError(_('email-matches-that-of-another-user'))