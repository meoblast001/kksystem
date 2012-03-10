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

from django import forms
from django.utils.translation import ugettext as _
from django.conf import settings

#
# Form displayed on login page.
#
class LoginForm(forms.Form):
	username = forms.CharField(max_length = 30, label = _('username'))
	password = forms.CharField(widget = forms.PasswordInput, label = _('password'))

#
# Form displayed on registration page.
#
class RegisterForm(forms.Form):
	username = forms.CharField(max_length = 30, label = _('username'))
	password = forms.CharField(widget = forms.PasswordInput, label = _('password'))
	repeat_password = forms.CharField(widget = forms.PasswordInput, label = _('repeat-password'))
	email = forms.EmailField(label = _('email'))

	def clean_repeat_password(self):
		if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
			raise forms.ValidationError(_('passwords-dont-match'))
		return self.cleaned_data

#
# Form displayed on password recovery email request page.
#
class RecoverPasswordForm(forms.Form):
	username = forms.CharField(max_length = 30, label = _('username'))
	email = forms.EmailField(label = _('email'))

#
# Form displayed on password reset form.
#
class RecoverResetPasswordForm(forms.Form):
	username = forms.CharField(max_length = 30, label = _('username'))
	password = forms.CharField(widget = forms.PasswordInput, label = _('password'))
	repeat_password = forms.CharField(widget = forms.PasswordInput, label = _('repeat-password'))

	def clean_repeat_password(self):
		if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
			raise forms.ValidationError(_('passwords-dont-match'))
		return self.cleaned_data

#
# Form displayed when selecting set to edit
#
class SelectSetForm(forms.Form):
	card_set = forms.ChoiceField(label = _('card-set'))

	def __init__(self, card_set_choices, is_edit_set, values = None):
		super(SelectSetForm, self).__init__(values)
		card_set_names = []
		#If edit set form, display option to create a new set
		if is_edit_set:
			card_set_names.append(['new', '[' + _('create-new-set') + ']'])
		#Copy set id and name for value and text of choices
		for i, item in enumerate(card_set_choices):
			card_set_names.append([str(item.pk), item.name])
		#Provide choices for card set choice field
		self.fields['card_set'].choices = card_set_names

#
# Form displayed when beginning a study session.
#
class RunOptionsForm(forms.Form):
	card_set = forms.ChoiceField(label = _('card-set'))
	study_type = forms.ChoiceField(widget = forms.RadioSelect, choices = [['normal', _('study-type-normal')], ['single_box', _('study-type-single-box')], ['no_box', _('study-type-no-box')]], label = _('study-type'))
	card_box = forms.ChoiceField(required = False, label = _('card-box'))

	def __init__(self, card_set_choices, card_box_choices, values = None):
		super(RunOptionsForm, self).__init__(values)
		card_set_names = []
		card_box_names = []
		#Copy set id and name for value and text of choices
		for i, item in enumerate(card_set_choices):
			card_set_names.append([str(item.pk), item.name])
		#Copy box id and name for value and text of choices
		for i, item in enumerate(card_box_choices):
			card_box_names.append([str(item.pk), item.name])
		#Provide choices for card set and boxes choice fields
		self.fields['card_set'].choices = card_set_names
		self.fields['card_box'].choices = card_box_names

#
# Form displayed when creating and editing card sets.
#
class EditSetForm(forms.Form):
	name = forms.CharField(max_length = 60, label = _('name'))

#
# Form displayed when creating and editing card boxes.
#
class EditBoxForm(forms.Form):
	name = forms.CharField(max_length = 60, label = _('name'))
	review_frequency = forms.IntegerField(label = _('review-frequency-in-days'))

#
# Form displayed when creating and editing cards.
#
class EditCardForm(forms.Form):
	front = forms.CharField(widget = forms.Textarea({'rows' : 5}), label = _('front'))
	back = forms.CharField(widget = forms.Textarea({'rows' : 5}), label = _('back'))
	card_box = forms.ChoiceField(label = _('card-box'))

	def __init__(self, card_box_choices, values = None):
		super(EditCardForm, self).__init__(values)
		#Copy box id and name for value and text of choices
		card_box_names = []
		for i, item in enumerate(card_box_choices):
			card_box_names.append([str(item.pk), item.name])
		#Create no box option
		card_box_names.append(['0', '[' + _('no-box') + ']'])
		#Provide choices for card box choice field
		self.fields['card_box'].choices = card_box_names

#
# Form displayed when changing user information in settings.
#
class SettingsChangeUserInfoForm(forms.Form):
	email = forms.EmailField(label = _('email'))
	current_password = forms.CharField(widget = forms.PasswordInput, required = False, label = _('current-password'))
	new_password = forms.CharField(widget = forms.PasswordInput, required = False, label = _('new-password'))
	repeat_new_password = forms.CharField(widget = forms.PasswordInput, required = False, label = _('repeat-new-password'))

	def clean_repeat_new_password(self):
		if self.cleaned_data['new_password'] != self.cleaned_data['repeat_new_password']:
			raise forms.ValidationError(_('passwords-dont-match'))
		return self.cleaned_data
