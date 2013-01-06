# Copyright (C) 2012 - 2013 Braden Walters

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

import csv
import codecs
from HTMLParser import HTMLParser
from karteikarten.models import Card, CardBox
from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError

class SetImporter(object):
  '''
  Describes set data being imported and imports it.
  '''

  class ImportError(Exception):
    pass

  class CardImporter(object):
    '''
    Describes an individual card being imported and imports it.
    '''
    VALID_ATTRIBUTES = [
        'front',
        'back',
      ]

    def __init__(self, restore = None):
      self._attributes = {}
      self._parent_importer = None
      self._cardset = None
      self._owner = None
      self._current_card_box = None
      if restore is not None:
        self._restore(restore)

    def save(self, defer_save = False):
      '''
      Converts data in importer into a model and, if specified, saves the model.
      @param defer_save If true, the card is not saved.
      @return Card model.
      @throws SetImporter.ImportError if the model does not pass validation.
      '''
      if self.valid():
        card = Card(front = self._attributes['front'],
                    back = self._attributes['back'],
                    parent_card_set = self._cardset, owner = self._owner,
                    current_box = self._current_card_box)
        try:
          card.full_clean()
          if not defer_save:
            card.save()
          return card
        except ValidationError:
          raise SetImporter.ImportError
      else:
        return None

    def serialise(self):
      '''
      Converts object into dictionaries and arrays that can be JSONified.
      @return Root of serialisation.
      '''
      return self._attributes

    def _restore(self, serialisation):
      '''
      Rebuilds object from dictionaries and arrays.
      @param serialisation Serialisation from which to build object.
      '''
      for key in serialisation:
        self.setAttribute(key, serialisation[key])

    def valid(self):
      '''
      Returns true of object is usable.
      '''
      return ('front' in self._attributes and 'back' in self._attributes)

    def setAttribute(self, key, value):
      '''
      Sets an attribute of the card.
      @param key Name of attribute.
      @param value Value of attribute.
      @return True if success, False if not a valid attribute.
      '''
      if key in SetImporter.CardImporter.VALID_ATTRIBUTES:
        self._attributes[key] = value
        if (self._parent_importer is not None and
            key not in self.parent_importer._used_card_fields):
          self._parent_importer._used_card_fields.append(key)
        return True
      else:
        return False

    def getAttribute(self, key):
      '''
      Gets an attribute by its name.
      @param key Name of attribute.
      @return Attribute or None if attribute does not exist.
      '''
      if key in self._attributes:
        return self._attributes[key]
      else:
        return None

    def getAllAttributesInFieldOrder(self):
      '''
      Gets all attributes by order of fields in ImportDescription. None for all
      missing attributes.
      @return Iterator of attributes.
      '''
      attributes = []
      for field in self._parent_importer.getCardFields():
        attributes.append(self.getAttribute(field))
      return attributes

  def __init__(self, cardset, owner, restore = None):
    self._used_card_fields = []
    self._card_importers = []
    self._cards_current_box = None
    self._cardset = cardset
    self._owner = owner
    if restore is not None:
      self._restore(restore, cardset, owner)
    else:
      try:
        self._cards_current_box = CardBox.objects.filter(
          parent_card_set = cardset, owner = owner). \
          order_by('review_frequency')[0]
      except IndexError:
        pass

  def save(self):
    '''
    Saves all data in the importer to the database.
    @throws SetImporter.ImportError if any model does not pass validation.
    '''
    cards_to_save = []
    for card_importer in self._card_importers:
      try:
        card = card_importer.save(defer_save = True)
        if card is not None:
          cards_to_save.append(card)
      except SetImporter.ImportError:
        pass
    Card.objects.bulk_create(cards_to_save)

  def serialise(self):
    '''
    Converts object into dictionaries and arrays that can be JSONified.
    @return Root of serialisation.
    '''
    serialisation = {'cards' : [], 'cards_current_box' : None}
    for card in self.getCards():
      serialisation['cards'].append(card.serialise())
    if self._cards_current_box is not None:
      serialisation['cards_current_box'] = {
          'id' : self._cards_current_box.pk,
          'name' : self._cards_current_box.name,
        }
    return serialisation

  def _restore(self, serialisation, cardset, owner):
    '''
    Rebuilds object from dictionaries and arrays.
    @param serialisation Serialisation from which to build object.
    '''
    if 'cards' in serialisation:
      for card in serialisation['cards']:
        new_card = SetImporter.CardImporter(restore = card)
        self.addCard(new_card)
    if ('cards_current_box' in serialisation and
        serialisation['cards_current_box'] is not None):
      try:
        self._current_box = self._cards_current_box = CardBox.objects.get(
          pk = serialisation['cards_current_box']['id'], owner = owner)
        #Update the card box for each existing card.
        for card in self.getCards():
          card._current_card_box = self._current_box
      except ObjectDoesNotExist:
        raise SetImporter.ImportError

  def addCard(self, card):
    '''
    Adds a SetImporter.CardImporter to the list of cards to be imported and
    initialises it.
    @param card SetImporter.CardImporter to add to the list.
    '''
    card._parent_importer = self
    card._cardset = self._cardset
    card._owner = self._owner
    card._current_card_box = self._cards_current_box
    #Add all fields that appear in the new card, but are not already in the list
    #of used cards, to that list.
    for key in card._attributes:
      if key not in self._used_card_fields:
        self._used_card_fields.append(key)
    self._card_importers.append(card)

  def getCards(self):
    '''
    Provides iterator to all cards.
    @return Object which iterates over all cards in this description.
    '''
    return self._card_importers

  def getCardFields(self):
    '''
    Provides iterator to card field names.
    @return Object which iterates over all card fields in this description
    '''
    return self._used_card_fields

class AnkiImporter(SetImporter):
  '''
  Import file from ANKI Text File.
  '''
  class AnkiHtml(HTMLParser):
    '''
    Converts Anki's HTML to plain text.
    '''
    def __init__(self, *args, **kwargs):
      HTMLParser.__init__(self, *args, **kwargs)
      self.result_string = ''

    def handle_starttag(self, tag, attrs):
      if tag == 'br':
        self.result_string += '\n'

    def handle_data(self, data):
      self.result_string += data

    def getResult(self):
      '''
      Gets result string.
      @return String of processed data.
      '''
      return self.result_string

  def __init__(self, file, *args, **kwargs):
    file = codecs.EncodedFile(file, 'utf-8')
    super(AnkiImporter, self).__init__(*args, **kwargs)
    sniffer = csv.Sniffer().sniff(file.read(1024))
    file.seek(0)
    csvreader = csv.reader(file, sniffer)
    for row in csvreader:
      try:
        card = SetImporter.CardImporter()
        for i in range(len(row)):
          try:
            if i == 0:
              anki_html = AnkiImporter.AnkiHtml()
              anki_html.feed(anki_html.unescape(row[i].decode('utf-8')))
              card.setAttribute('front', anki_html.getResult())
            elif i == 1:
              anki_html = AnkiImporter.AnkiHtml()
              anki_html.feed(anki_html.unescape(row[i].decode('utf-8')))
              card.setAttribute('back', anki_html.getResult())
          except UnicodeDecodeError:
            pass
        self.addCard(card)
      except IndexError:
        self.addCard(SetImporter.CardImporter())
