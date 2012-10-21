# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
  def forwards(self, orm):
    db.delete_column('karteikarten_cardbox', 'level')

  def backwards(self, orm):
    db.add_column('karteikarten_cardbox', 'level',
                  self.gf('django.db.models.fields.IntegerField')(default = 0),
                  keep_default = False)

  complete_apps = ['karteikarten']
