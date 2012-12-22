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
from django.utils.translation import ugettext_lazy as _
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from models import *

#
# Form displayed on login page.
#
class LoginForm(forms.Form):
  username = forms.CharField(max_length = 30, label = _('username'))
  password = forms.CharField(widget = forms.PasswordInput,
                             label = _('password'))

#
# Form displayed on registration page.
#
class RegisterForm(forms.ModelForm):
  class Meta:
    model = User
    fields = ('username', 'password', 'repeat_password', 'email')

  password = forms.CharField(widget = forms.PasswordInput,
                             label = _('password'), required = True)
  repeat_password = forms.CharField(widget = forms.PasswordInput,
                                    label = _('repeat-password'),
                                    required = True)
  email = forms.EmailField(label = _('email'), required = True)

  def save(self, *args, **kwargs):
    self.instance.set_password(self.cleaned_data['password'])
    super(RegisterForm, self).save(*args, **kwargs)

  def clean_repeat_password(self):
    if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
      raise forms.ValidationError(_('passwords-dont-match'))
    return self.cleaned_data['repeat_password']

#
# Form displayed on password recovery email request page.
#
class RecoverPasswordForm(forms.Form):
  username = forms.CharField(max_length = 30, label = _('username'))
  email = forms.EmailField(label = _('email'))

#
# Form displayed on password reset form.
#
class RecoverResetPasswordForm(forms.ModelForm):
  class Meta:
    model = User
    fields = ('username', 'password', 'repeat_password')

  username = forms.CharField(max_length = 30, label = _('username'))
  password = forms.CharField(widget = forms.PasswordInput,
                             label = _('password'), required = True)
  repeat_password = forms.CharField(widget = forms.PasswordInput,
                                    label = _('repeat-password'),
                                    required = True)

  def save(self, *args, **kwargs):
    self.instance.set_password(self.cleaned_data['password'])
    super(RecoverResetPasswordForm, self).save(*args, **kwargs)

  def clean_username(self):
    if self.cleaned_data['username'] != self.instance.username:
      raise forms.ValidationError(_('provided-username-is-incorrect'))
    return self.cleaned_data['username']

  def clean_repeat_password(self):
    if self.cleaned_data['password'] != self.cleaned_data['repeat_password']:
      raise forms.ValidationError(_('passwords-dont-match'))
    return self.cleaned_data['repeat_password']

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
  study_type = forms.ChoiceField(widget = forms.RadioSelect, choices = [
      ['normal', _('study-type-normal')],
      ['single_box', _('study-type-single-box')],
      ['no_box', _('study-type-no-box')]
    ], label = _('study-type'))
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
class EditSetForm(forms.ModelForm):
  class Meta:
    model = CardSet
    fields = ('name', 'reintroduce_cards', 'reintroduce_cards_amount',
              'reintroduce_cards_frequency')

#
# Form displayed when creating and editing card boxes.
#
class EditBoxForm(forms.ModelForm):
  class Meta:
    model = CardBox
    fields = ('name', 'review_frequency')

#
# Form displayed when creating and editing cards.
#
class EditCardForm(forms.ModelForm):
  class Meta:
    model = Card
    fields = ('front', 'back', 'current_box')
    widgets = {
        'front' : forms.Textarea(attrs = {'rows' : 5}),
        'back' : forms.Textarea(attrs = {'rows' : 5}),
      }

  current_box = forms.ChoiceField(label = _('card-box'))

  def __init__(self, *args, **kwargs):
    super(EditCardForm, self).__init__(*args, **kwargs)
    #Copy box id and name for value and text of choices
    card_box_names = []
    card_boxes = CardBox.objects.filter(owner = self.instance.owner,
      parent_card_set = self.instance.parent_card_set).order_by('pk')
    for i, item in enumerate(card_boxes):
      card_box_names.append([str(item.pk), item.name])
    #Create no box option
    card_box_names.append(['0', '[' + _('no-box') + ']'])
    #Provide choices for card box choice field
    self.fields['current_box'].choices = card_box_names
    #If existing card is provided as the instance, set the initial current box
    #to the instance's current box
    if self.instance.pk != None:
      self.initial['current_box'] = \
        self.instance.current_box.pk if self.instance.current_box != None else 0

  def clean_current_box(self):
    try:
      if int(self.cleaned_data['current_box']) == 0:
        return None
      return CardBox.objects.get(pk = self.cleaned_data['current_box'],
        parent_card_set = self.instance.parent_card_set,
        owner = self.instance.owner)
    except ObjectDoesNotExist:
      raise forms.ValidationError(_('internal-server-error'))
    except ValueError:
      raise forms.ValidationError(_('internal-server-error'))

  def clean(self):
    super(EditCardForm, self).clean()
    if (CardSet.objects.filter(pk = self.instance.parent_card_set.pk,
                               owner = self.instance.owner).count() <= 0):
      raise forms.ValidationError(_('internal-server-error'))
    return self.cleaned_data

#
# Form displayed when changing user information in settings.
#
class SettingsChangeUserInfoForm(forms.Form):
  email = forms.EmailField(label = _('email'))
  current_password = forms.CharField(widget = forms.PasswordInput,
                                     required = False,
                                     label = _('current-password'))
  new_password = forms.CharField(widget = forms.PasswordInput, required = False,
                                 label = _('new-password'))
  repeat_new_password = forms.CharField(widget = forms.PasswordInput,
                                        required = False,
                                        label = _('repeat-new-password'))

  def clean_repeat_new_password(self):
    if (self.cleaned_data['new_password'] !=
        self.cleaned_data['repeat_new_password']):
      raise forms.ValidationError(_('passwords-dont-match'))
    return self.cleaned_data
