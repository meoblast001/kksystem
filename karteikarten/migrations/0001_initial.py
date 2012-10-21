# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class User(models.Model):
  class Meta:
    app_label = 'auth'

class CardSet(models.Model):
  class Meta:
    app_label = 'karteikarten'

class CardBox(models.Model):
  class Meta:
    app_label = 'karteikarten'

class Migration(SchemaMigration):
  def forwards(self, orm):
    #CardSet
    db.create_table('karteikarten_cardset', (
        ('owner',
         self.gf('django.db.models.fields.related.ForeignKey')(to=User())),
        ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ('name', self.gf('django.db.models.fields.CharField')(max_length=60)),
      ))
    db.send_create_signal('karteikarten', ['CardSet'])

    #CardBox
    db.create_table('karteikarten_cardbox', (
        ('name', self.gf('django.db.models.fields.CharField')(max_length = 60)),
        ('level', self.gf('django.db.models.fields.IntegerField')()),
        ('parent_card_set',
         self.gf('django.db.models.fields.related.ForeignKey')(to = CardSet())),
        ('review_frequency', self.gf('django.db.models.fields.IntegerField')()),
        ('owner',
         self.gf('django.db.models.fields.related.ForeignKey')(to = User())),
        ('last_reviewed', self.gf('django.db.models.fields.DateTimeField')()),
        ('id',
         self.gf('django.db.models.fields.AutoField')(primary_key = True)),
      ))
    db.send_create_signal('karteikarten', ['CardBox'])

    #Card
    db.create_table('karteikarten_card', (
        ('parent_card_set',
         self.gf('django.db.models.fields.related.ForeignKey')(to = CardSet())),
        ('back', self.gf('django.db.models.fields.TextField')()),
        ('owner',
         self.gf('django.db.models.fields.related.ForeignKey')(to = User())),
        ('current_box',
         self.gf('django.db.models.fields.related.ForeignKey')
         (to = CardBox(), null = True, blank = True)),
        ('front', self.gf('django.db.models.fields.TextField')()),
        ('id',
         self.gf('django.db.models.fields.AutoField')(primary_key = True)),
      ))
    db.send_create_signal('karteikarten', ['Card'])

  def backwards(self, orm):
    db.delete_table('karteikarten_cardset')
    db.delete_table('karteikarten_cardbox')
    db.delete_table('karteikarten_card')

  complete_apps = ['karteikarten']
