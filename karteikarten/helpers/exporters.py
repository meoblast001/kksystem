# Copyright (C) 2013 Braden Walters

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

from karteikarten.models import Card

class AnkiExporter(object):
  '''
  Exports cards to ANKI Text File.
  '''
  @staticmethod
  def export(cardset):
    result = u'front\tback\n'
    for card in Card.objects.filter(parent_card_set = cardset):
      result += card.front + '\t' + card.back + '\n'
    return result

  @staticmethod
  def getExtension():
    return '.txt'
