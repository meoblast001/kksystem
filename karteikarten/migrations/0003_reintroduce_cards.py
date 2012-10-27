# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
  def forwards(self, orm):
    db.add_column('karteikarten_cardset', 'reintroduce_cards',
      self.gf('django.db.models.fields.BooleanField')(default = False),
      keep_default = False)

    db.add_column('karteikarten_cardset', 'reintroduce_cards_amount',
      self.gf('django.db.models.fields.IntegerField')(null = True),
      keep_default = False)

    db.add_column('karteikarten_cardset', 'reintroduce_cards_frequency',
      self.gf('django.db.models.fields.IntegerField')(null = True),
      keep_default = False)

    db.add_column('karteikarten_cardset', 'last_reintroduced_cards',
      self.gf('django.db.models.fields.DateTimeField')
        (default = datetime.date.today()),
      keep_default = False)

  def backwards(self, orm):
    db.delete_column('karteikarten_cardset', 'reintroduce_cards')
    db.delete_column('karteikarten_cardset', 'reintroduce_cards_amount')
    db.delete_column('karteikarten_cardset', 'reintroduce_cards_frequency')
    db.delete_column('karteikarten_cardset', 'last_reintroduced_cards')

  complete_apps = ['karteikarten']
