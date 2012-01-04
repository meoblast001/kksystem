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
from django.http import HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from datetime import datetime
import random
import string
from django.core.mail import send_mail
from django.contrib.sites.models import Site
from django.contrib.auth.decorators import login_required

#
# Login
#
def Login(request):
	#Submit
	if request.method == 'POST':
		form = LoginForm(request.POST)
		if form.is_valid():
			user = authenticate(username = form.cleaned_data['username'], password = form.cleaned_data['password'])
			if user is not None:
				if user.is_active:
					login(request, user)
					if 'next' in request.GET:
						return HttpResponseRedirect(request.GET['next'])
					else:
						return HttpResponseRedirect(reverse('centre'))
			return render_to_response('error.html', {'message' : 'Login failed.', 'go_back_to' : reverse('login')}, context_instance = RequestContext(request))
		else:
			if 'next' in request.GET:
				url_append = '?next=' + request.GET['next']
			else:
				url_append = ''
			return render_to_response('login_form.html', {'form' : LoginForm(request.POST), 'url_append' : url_append}, context_instance = RequestContext(request))

	#Form
	else:
		if 'next' in request.GET:
			url_append = '?next=' + request.GET['next']
		else:
			url_append = ''
		return render_to_response('login_form.html', {'form' : LoginForm(), 'url_append' : url_append}, context_instance = RequestContext(request))

#
# Logout
#
@login_required
def Logout(request):
	logout(request)
	return HttpResponseRedirect(reverse('centre'))

#
# Register
#
def Register(request):
	#Submit
	if request.method == 'POST':
		if 'dnm_verify' in request.POST and request.POST['dnm_verify'] != '':
			raise Http404

		form = RegisterForm(request.POST)
		if form.is_valid():
			#Must create a unique user
			users_with_same_username = User.objects.filter(username = form.cleaned_data['username'])
			users_with_same_email = User.objects.filter(email = form.cleaned_data['email'])
			if len(users_with_same_username) == 0:
				if len(users_with_same_email) == 0:
					new_user = User.objects.create_user(username = form.cleaned_data['username'], email = form.cleaned_data['email'], password = form.cleaned_data['password'])
					return render_to_response('confirmation.html', {'message' : 'Registration successful.', 'short_messsage' : 'Registered', 'go_to' : reverse('centre'), 'go_to_name' : 'Back to Centre'}, context_instance = RequestContext(request))
				else:
					return render_to_response('error.html', {'message' : 'Email matches that of another user.', 'go_back_to' : reverse('register')}, context_instance = RequestContext(request))
			else:
				return render_to_response('error.html', {'message' : 'Username matches that of another user.', 'go_back_to' : reverse('register')}, context_instance = RequestContext(request))
		else:
			return render_to_response('register_form.html', {'form' : RegisterForm(request.POST)}, context_instance = RequestContext(request))

	#Form
	else:
		return render_to_response('register_form.html', {'form' : RegisterForm()}, context_instance = RequestContext(request))

#
# Request password recovery email
#
def RecoverPassword(request):
	#Submit
	if request.method == 'POST':
		form = RecoverPasswordForm(request.POST)
		if form.is_valid():
			users = User.objects.filter(username = form.cleaned_data['username'], email = form.cleaned_data['email'])
			if len(users) > 0:
				user = users[0]

				#Generate random identification string for this password recovery session
				ident_string = ''
				for i in range(10):
					ident_string += random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits)
				#Get current recovery session information
				password_recovery = cache.get('password_recovery')
				if password_recovery == None:
					password_recovery = []
				#Purge all expired recovery sessions
				for session in password_recovery:
					time_delta = datetime.now() - session['datetime']
					if ((time_delta.microseconds + (time_delta.seconds + time_delta.days * 24 * 3600) * 10 ** 6) / 10 **6) > 18000:
						password_recovery.remove(session)
				#Cache recovery session information
				password_recovery.append({'user' : user, 'ident' : ident_string, 'datetime' : datetime.now()})
				cache.set('password_recovery', password_recovery, 18000)
				#Dispatch email
				site = Site.objects.get_current()
				send_mail('Password Recovery', 'Reset your password here: http://' + site.domain + reverse('recover-reset-password') + '?id=' + ident_string, 'noreply@' + site.domain, [user.email], fail_silently = False)

				return render_to_response('confirmation.html', {'message' : 'An email was sent to you with a link to reset your password.', 'short_messsage' : 'Request Pending', 'go_to' : reverse('login'), 'go_to_name' : 'Back to Login'}, context_instance = RequestContext(request))
			else:
				return render_to_response('error.html', {'message' : 'Username and email address do not match a valid user.', 'go_back_to' : reverse('recover-password')}, context_instance = RequestContext(request))
		else:
			return render_to_response('recover_password_form.html', {'form' : RecoverPasswordForm(request.POST)}, context_instance = RequestContext(request))
	#Form
	else:
		return render_to_response('recover_password_form.html', {'form' : RecoverPasswordForm()}, context_instance = RequestContext(request))

#
# Reset password from password recovery email
#
def RecoverResetPassword(request):
	#Submit
	if request.method == 'POST':
		form = RecoverResetPasswordForm(request.POST)
		password_recovery = cache.get('password_recovery')
		if password_recovery != None and 'id' in request.GET:
			if form.is_valid():
				for session in password_recovery:
					if session['ident'] == request.GET['id'] and session['user'].username == form.cleaned_data['username']:
						session['user'].set_password(request.POST['password'])
						session['user'].save()
						#Remove current recovery session
						password_recovery.remove(session)
						cache.set('password_recovery', password_recovery, 18000)

						return render_to_response('confirmation.html', {'message' : 'Password changed.', 'short_messsage' : 'Password Recovery Complete', 'go_to' : reverse('login'), 'go_to_name' : 'Back to Login'}, context_instance = RequestContext(request))
					else:
						return render_to_response('error.html', {'message' : 'Data provided does not match password recovery session information. Either your username is incorrect or you did not follow the correct URL.', 'go_back_to' : reverse('recover-password')}, context_instance = RequestContext(request))
			else:
				return render_to_response('recover_reset_password_form.html', {'form' : RecoverResetPasswordForm(request.POST), 'url_append' : '?id=' + request.GET['id']}, context_instance = RequestContext(request))
		else:
			return render_to_response('error.html', {'message' : 'An error occurred. Perhaps you did not provide a recovery session ID in the URL.', 'go_back_to' : reverse('recover-password')}, context_instance = RequestContext(request))
	#Form
	else:
		password_recovery = cache.get('password_recovery')
		if password_recovery != None and 'id' in request.GET:
			for session in password_recovery:
				if session['ident'] == request.GET['id']:
					return render_to_response('recover_reset_password_form.html', {'form' : RecoverResetPasswordForm(), 'url_append' : '?id=' + request.GET['id']}, context_instance = RequestContext(request))
		return render_to_response('error.html', {'message' : 'Recovery session ID is invalid.', 'go_back_to' : reverse('centre')}, context_instance = RequestContext(request))
