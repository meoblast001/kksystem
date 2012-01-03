# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
	
	def forwards(self, orm):
		
		# Deleting field 'CardBox.level'
		db.delete_column('karteikarten_cardbox', 'level')
	
	
	def backwards(self, orm):
		
		# Adding field 'CardBox.level'
		db.add_column('karteikarten_cardbox', 'level', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)
	
	
	models = {
		'auth.group': {
			'Meta': {'object_name': 'Group'},
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
			'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
		},
		'auth.permission': {
			'Meta': {'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
			'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
			'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
		},
		'auth.user': {
			'Meta': {'object_name': 'User'},
			'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
			'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
			'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
			'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
			'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
			'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
			'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
			'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
			'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
			'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
			'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
		},
		'contenttypes.contenttype': {
			'Meta': {'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
			'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
			'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
		},
		'karteikarten.card': {
			'Meta': {'object_name': 'Card'},
			'back': ('django.db.models.fields.TextField', [], {}),
			'current_box': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['karteikarten.CardBox']", 'null': 'True', 'blank': 'True'}),
			'front': ('django.db.models.fields.TextField', [], {}),
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
			'parent_card_set': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['karteikarten.CardSet']"})
		},
		'karteikarten.cardbox': {
			'Meta': {'object_name': 'CardBox'},
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'last_reviewed': ('django.db.models.fields.DateTimeField', [], {}),
			'name': ('django.db.models.fields.CharField', [], {'max_length': '60'}),
			'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
			'parent_card_set': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['karteikarten.CardSet']"}),
			'review_frequency': ('django.db.models.fields.IntegerField', [], {})
		},
		'karteikarten.cardset': {
			'Meta': {'object_name': 'CardSet'},
			'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
			'name': ('django.db.models.fields.CharField', [], {'max_length': '60'}),
			'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
		}
	}
	
	complete_apps = ['karteikarten']
