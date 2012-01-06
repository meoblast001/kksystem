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
	email = forms.EmailField()

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

	def __init__(self, card_box_choices, initial, values = None):
		super(EditCardForm, self).__init__(values)
		#Copy box id and name for value and text of choices
		card_box_names = []
		for i, item in enumerate(card_box_choices):
			card_box_names.append([str(item.pk), item.name])
		#Provide choices for card box choice field
		self.fields['card_box'].choices = card_box_names
		#Set default value if provided
		if initial != None:
			self.fields['card_box'].initial = initial
