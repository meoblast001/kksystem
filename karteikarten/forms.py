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

#
# Form displayed on login page.
#
class LoginForm(forms.Form):
	username = forms.CharField(max_length = 30)
	password = forms.CharField(widget = forms.PasswordInput)

#
# Form displayed on registration page.
#
class RegisterForm(forms.Form):
	username = forms.CharField(max_length = 30)
	password = forms.CharField(widget = forms.PasswordInput)
	repeat_password = forms.CharField(widget = forms.PasswordInput)
	email = forms.EmailField()

	def clean_repeat_password(self):
		if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
			raise forms.ValidationError('The two passwords do not match.')
		return self.cleaned_data

#
# Form displayed on password recovery email request page.
#
class RecoverPasswordForm(forms.Form):
	username = forms.CharField(max_length = 30)
	email = forms.EmailField()

#
# Form displayed on password reset form.
#
class RecoverResetPasswordForm(forms.Form):
	username = forms.CharField(max_length = 30)
	password = forms.CharField(widget = forms.PasswordInput)
	repeat_password = forms.CharField(widget = forms.PasswordInput)

	def clean_repeat_password(self):
		if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
			raise forms.ValidationError('The two passwords do not match.')
		return self.cleaned_data

#
# Form displayed when selecting set to edit
#
class SelectSetForm(forms.Form):
	card_set = forms.ChoiceField()

	def __init__(self, card_set_choices, is_edit_set, values = None):
		super(SelectSetForm, self).__init__(values)
		card_set_names = []
		#If edit set form, display option to create a new set
		if is_edit_set:
			card_set_names.append(['new', '[Create New Set]'])
		#Copy set id and name for value and text of choices
		for i, item in enumerate(card_set_choices):
			card_set_names.append([str(item.pk), item.name])
		#Provide choices for card set choice field
		self.fields['card_set'].choices = card_set_names

#
# Form displayed when beginning a study session.
#
class RunOptionsForm(forms.Form):
	card_set = forms.ChoiceField()
	study_type = forms.ChoiceField(widget = forms.RadioSelect, choices = [['normal', 'Normal'], ['single_box', 'Practice Single Box'], ['no_box', 'Practice Cards with No Box']])
	card_box = forms.ChoiceField(required = False)

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
	name = forms.CharField(max_length = 60)

#
# Form displayed when creating and editing card boxes.
#
class EditBoxForm(forms.Form):
	name = forms.CharField(max_length = 60)
	review_frequency = forms.IntegerField(label = "Review Frequency (In Days)")

#
# Form displayed when creating and editing cards.
#
class EditCardForm(forms.Form):
	front = forms.CharField(widget = forms.Textarea({'rows' : 5}))
	back = forms.CharField(widget = forms.Textarea({'rows' : 5}))
	card_box = forms.ChoiceField()

	def __init__(self, card_box_choices, values = None):
		super(EditCardForm, self).__init__(values)
		#Copy box id and name for value and text of choices
		card_box_names = []
		for i, item in enumerate(card_box_choices):
			card_box_names.append([str(item.pk), item.name])
		#Create no box option
		card_box_names.append(['0', '[No Box]'])
		#Provide choices for card box choice field
		self.fields['card_box'].choices = card_box_names
