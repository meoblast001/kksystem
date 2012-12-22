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
from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.contrib import auth
from django.core.cache import cache
from datetime import datetime
import random
import string
from django.core.mail import send_mail
from django.contrib.sites.models import Site
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext_lazy as _

#
# Login
#
def login(request):
  #AJAX
  if ('HTTP_X_REQUESTED_WITH' in request.META and
      request.META['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'):
    is_ajax = True
  else:
    is_ajax = False
  #Submit
  if request.method == 'POST':
    form = LoginForm(request.POST)
    if form.is_valid():
      user = auth.authenticate(username = form.cleaned_data['username'],
                          password = form.cleaned_data['password'])
      if user is not None:
        if user.is_active:
          auth.login(request, user)
          if is_ajax:
            return HttpResponse('{"status" : "success"}')
          else:
            if 'next' in request.GET:
              return HttpResponseRedirect(request.GET['next'])
            else:
              return HttpResponseRedirect(reverse('centre'))
      if is_ajax:
        return HttpResponse('{"status" : "fail", "message" : "' +
                            _('login-failed') + '"}')
      else:
        return render_to_response('error.html', {
            'message' : _('login-failed'),
            'go_back_to' : reverse('login'),
            'title' : _('error'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
    else:
      if is_ajax:
        return HttpResponse('{"status" : "fail", ' +
                            '"message" : "Required fields not filled."}')
      else:
        if 'next' in request.GET:
          url_append = '?next=' + request.GET['next']
        else:
          url_append = ''
        return render_to_response('login/login_form.html', {
            'form' : LoginForm(request.POST),
            'title' : _('login'),
            'site_link_chain' : zip([], []),
            'url_append' : url_append
          }, context_instance = RequestContext(request))

  #Form
  else:
    #If user is mobile, go to mobile site
    if request.META['HTTP_USER_AGENT'].upper().find('MOBILE') != -1:
      return HttpResponseRedirect(reverse('mobile'))

    if 'next' in request.GET:
      url_append = '?next=' + request.GET['next']
    else:
      url_append = ''
    return render_to_response('login/login_form.html', {
        'form' : LoginForm(),
        'title' : _('login'),
        'site_link_chain' : zip([], []),
        'url_append' : url_append
      }, context_instance = RequestContext(request))

#
# Logout
#
@login_required
def logout(request):
  auth.logout(request)
  if ('HTTP_X_REQUESTED_WITH' in request.META and
      request.META['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'):
    return HttpResponse()
  else:
    return HttpResponseRedirect(reverse('centre'))

#
# Register
#
def register(request):
  #Submit
  if request.method == 'POST':
    if 'dnm_verify' in request.POST and request.POST['dnm_verify'] != '':
      raise Http403

    form = RegisterForm(request.POST)
    if form.is_valid():
      form.save()
      return render_to_response('confirmation.html', {
          'message' : _('registration-successful'),
          'short_messsage' : _('registered'),
          'go_to' : reverse('centre'),
          'go_to_name' : _('back-to-centre'),
          'title' : _('confirmation'),
          'site_link_chain' : zip([], [])
        }, context_instance = RequestContext(request))
    else:
      return render_to_response('login/register_form.html', {
          'form' : RegisterForm(request.POST),
          'title' : _('register'),
          'site_link_chain' : zip([reverse('login')], [_('login')])
        }, context_instance = RequestContext(request))

  #Form
  else:
    return render_to_response('login/register_form.html', {
        'form' : RegisterForm(),
        'title' : _('register'),
        'site_link_chain' : zip([reverse('login')], [_('login')])
      }, context_instance = RequestContext(request))

#
# Request password recovery email
#
def recoverPassword(request):
  #Submit
  if request.method == 'POST':
    form = RecoverPasswordForm(request.POST)
    if form.is_valid():
      users = User.objects.filter(username = form.cleaned_data['username'],
                                  email = form.cleaned_data['email'])
      if len(users) > 0:
        user = users[0]

        #Generate random identification string for this password recovery
        #session
        ident_string = ''
        for i in range(10):
          ident_string += random.choice(string.ascii_uppercase +
                                        string.ascii_lowercase + string.digits)
        #Get current recovery session information
        password_recovery = cache.get('password_recovery')
        if password_recovery == None:
          password_recovery = []
        #Purge all expired recovery sessions
        for session in password_recovery:
          time_delta = datetime.now() - session['datetime']
          if (((time_delta.microseconds +
              (time_delta.seconds + time_delta.days * 24 * 3600) * 10 ** 6) /
              10 ** 6) > 18000):
            password_recovery.remove(session)
        #Cache recovery session information
        password_recovery.append({
            'user' : user,
            'ident' : ident_string,
            'datetime' : datetime.now()
          })
        cache.set('password_recovery', password_recovery, 18000)
        #Dispatch email
        site = Site.objects.get_current()
        send_mail(_('password-recovery'),
                  _('reset-password-here') +
                  ': http://' + site.domain +
                  reverse('recover-reset-password') + '?id=' + ident_string,
                  'noreply@' + site.domain, [user.email], fail_silently = False)

        return render_to_response('confirmation.html', {
            'message' : _('email-sent-with-reset-password-link'),
            'short_messsage' : _('request-pending'),
            'go_to' : reverse('login'),
            'go_to_name' : _('back-to-login'),
            'title' : _('confirmation'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
      else:
        return render_to_response('error.html', {
            'message' : _('username-and-email-do-not-match-valid-user'),
            'go_back_to' : reverse('recover-password'),
            'title' : _('error'),
            'site_link_chain' : zip([], [])
          }, context_instance = RequestContext(request))
    else:
      return render_to_response('login/recover_password_form.html', {
          'form' : RecoverPasswordForm(request.POST),
          'title' : _('request-password-recovery-email'),
          'site_link_chain' : zip([reverse('login')], [_('login')])
        }, context_instance = RequestContext(request))
  #Form
  else:
    return render_to_response('login/recover_password_form.html', {
        'form' : RecoverPasswordForm(),
        'title' : _('request-password-recovery-email'),
        'site_link_chain' : zip([reverse('login')], [_('login')])
      }, context_instance = RequestContext(request))

#
# Reset password from password recovery email
#
def recoverResetPassword(request):
  #Submit
  if request.method == 'POST':
    #Find user for given recovery session
    session = None
    password_recovery = cache.get('password_recovery')
    if password_recovery != None and 'id' in request.GET:
      for cur_session in password_recovery:
        if cur_session['ident'] == request.GET['id']:
          session = cur_session
    if session == None:
      return render_to_response('error.html', {
          'message' : _('recovery-session-id-not-found'),
          'go_back_to' : reverse('recover-password'),
          'title' : _('error'),
          'site_link_chain' : zip([], [])
        }, context_instance = RequestContext(request))

    form = RecoverResetPasswordForm(request.POST, instance = session['user'])
    if form.is_valid():
      form.save()
      #Remove current recovery session
      password_recovery.remove(session)
      cache.set('password_recovery', password_recovery, 18000)

      return render_to_response('confirmation.html', {
          'message' : _('password-changed'),
          'short_messsage' : _('password-recovery-complete'),
          'go_to' : reverse('login'),
          'go_to_name' : _('back-to-login'),
          'title' : _('confirmation'),
          'site_link_chain' : zip([], [])
        }, context_instance = RequestContext(request))
    else:
      return render_to_response('login/recover_reset_password_form.html', {
          'form' : form,
          'url_append' : '?id=' + request.GET['id'],
          'title' : _('reset-password'),
          'site_link_chain' : zip([
              reverse('login'),
              reverse('recover-password')
            ], [
              'Login',
              _('request-password-recovery-email')
            ])
        }, context_instance = RequestContext(request))
  #Form
  else:
    password_recovery = cache.get('password_recovery')
    if password_recovery != None and 'id' in request.GET:
      for session in password_recovery:
        if session['ident'] == request.GET['id']:
          return render_to_response('login/recover_reset_password_form.html', {
              'form' : RecoverResetPasswordForm(),
              'url_append' : '?id=' + request.GET['id'],
              'title' : _('reset-password'),
              'site_link_chain' : zip([
                  reverse('login'),
                  reverse('recover-password')
                ], [
                  _('login'),
                  _('request-password-recovery-email')
                ])
            }, context_instance = RequestContext(request))
    return render_to_response('error.html', {
        'message' : _('recovery-session-id-invalid'),
        'go_back_to' : reverse('centre'),
        'title' : _('error'),
        'site_link_chain' : zip([], [])
      }, context_instance = RequestContext(request))
