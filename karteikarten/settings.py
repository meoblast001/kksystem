# Copyright (C) 2011 Braden Walters

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

from models import *
from forms import *
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth import authenticate

#
# Main settings page.
#
@login_required
def settings(request):
	return render_to_response('settings/settings.html', {
      'title' : _('settings'),
      'site_link_chain' : zip([reverse('centre')], [_('centre')])
    }, context_instance = RequestContext(request))

#
# Change user information.
#
@login_required
def changeUserInformation(request):
	#Submit
	if request.method == 'POST':
		form = SettingsChangeUserInfoForm(request.POST)
		if form.is_valid():
			request.user.email = form.cleaned_data['email']
			#Save password if fields are not empty
			if (form.cleaned_data['current_password'] != '' and
          form.cleaned_data['new_password'] != '' and
          form.cleaned_data['repeat_new_password'] != ''):
				#Current password must be correct
				if (authenticate(username = request.user.username,
                         password = form.cleaned_data['current_password'])
            != None):
					request.user.set_password(form.cleaned_data['new_password'])
				else:
					return render_to_response('error.html', {
              'message' : _('current-password-incorrect'),
              'go_back_to' : reverse('settings-change-user-information'),
              'title' : _('error'),
              'site_link_chain' : zip([
                  reverse('centre'),
                  reverse('settings'),
                  reverse('settings-change-user-information')
                ], [
                  _('centre'),
                  _('settings'),
                  _('change-user-information')
                ])
            }, context_instance = RequestContext(request))
			request.user.save()

			return render_to_response('confirmation.html', {
          'message' : _('user-info-changed'),
          'short_messsage' : _('registered'),
          'go_to' : reverse('settings'),
          'go_to_name' : _('back-to-settings'),
          'title' : _('confirmation'),
          'site_link_chain' : zip([
              reverse('centre'),
              reverse('settings'),
              reverse('settings-change-user-information')
            ], [
              _('centre'),
              _('settings'),
              _('change-user-information')
            ])
        }, context_instance = RequestContext(request))
		else:
			return render_to_response('settings/change_user_information.html', {
          'title' : _('change-user-information'),
          'site_link_chain' : zip([reverse('centre'), reverse('settings')],
                                  [_('centre'), _('settings')]),
          'change_user_info_form' : SettingsChangeUserInfoForm(request.POST)
        }, context_instance = RequestContext(request))
	#Form
	else:
		return render_to_response('settings/change_user_information.html', {
        'title' : _('change-user-information'),
        'site_link_chain' : zip([reverse('centre'), reverse('settings')],
                                [_('centre'), _('settings')]),
        'change_user_info_form' :
          SettingsChangeUserInfoForm({'email' : request.user.email})
      }, context_instance = RequestContext(request))
