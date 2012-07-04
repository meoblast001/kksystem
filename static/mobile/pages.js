/*
Copyright (C) 2012 Braden Walters

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var Pages =
{
	database : null,
	websql_database : null,
	offline_mode : false,

	//Login

	OnlineLoginSubmit : function(post_data)
	{
		post_data['csrfmiddlewaretoken'] = CSRF_TOKEN;
		$.ajax({
			type : 'POST',
			url : SITE_ROOT + '/accounts/login/',
			data : post_data,
			dataType : 'json',
			success : function(result)
			{
				if (result['status'] == 'success')
				{
					Pages.database.LoginOnline(post_data['username'], function()
					{
						Pages.Centre();
					},
					function(type, message)
					{
						Pages.FatalError(message);
					});
				}
				else if (result['status'] == 'fail')
					alert(result['message']);
			},
			error : function(jq_xhr, text_status, error_thrown)
			{
				alert('Error: ' + text_status);
			}
		});
	},

	OfflineLoginSubmit : function(post_data)
	{
		Pages.database.LoginOffline(post_data['user'], function()
		{
			Pages.Centre();
		},
		function(type, message)
		{
			Pages.FatalError(message);
		});
	},

	Login : function()
	{
		$('#content').html('<div id="online_login" /><div id="offline_login" />'); //Clear content area
		$('#header_text').html('Welcome');

		var online_login_form = new Form(Pages.OnlineLoginSubmit, 'box_form', 'Online Login');
		online_login_form.AddText('username', 'Username', null, 30);
		online_login_form.AddPassword('password', 'Password');
		online_login_form.Display($('#online_login'));

		Pages.database.GetUsersByNetworkStatus(false, function(results)
		{
			var offline_login_form = new Form(Pages.OfflineLoginSubmit, 'box_form', 'Offline Login');
			var options = {};
			for (var i = 0; i < results.length; ++i)
			{
				var cur_result = results[i];
				options[cur_result['id']] = cur_result['username'];
			}
			offline_login_form.AddSelect('user', 'User', options, null);
			offline_login_form.Display($('#offline_login'));
		},
		function(type, message)
		{
			if (type == 'no-local-db')
				$('#offline_login').html('No offline mode supported.');
			else
				$('#offline_login').html('Offline mode error: ' + message);
		});
	},

	//Centre

	Centre : function()
	{
		var content =
			'<a href="javascript:Pages.StudyOptions()" class="menu_item">Study</a>' +
			'<a href="javascript:Pages.EditSetSelect()" class="menu_item">Edit</a>' +
			'<a href="javascript:Pages.Settings()" class="menu_item">Settings</a>' +
			'<a href="javascript:Pages.Exit()" class="menu_item">Exit</a>';
		$('#content').html(content);
		$('#header_text').html('Centre');
	},

	//Study

	StudyOptions : function()
	{
		Pages.database.GetSets({}, function(result, params)
		{
			//Get options
			var options = {};
			for (i = 0; i < result.length; ++i)
				options[result[i].id] = result[i].name;

			var study_options_form = new Form(Pages.StudyOptions2, 'box_form', 'Continue');
			study_options_form.AddSelect('set', 'Set', options, null);
			study_options_form.AddRadio('study_type', 'Study Type', {'normal' : 'Normal', 'single_box' : 'Practice Single Box', 'no_box' : 'Practice Cards Currently in No Box'});
			$('#content').html(''); //Clear content area
			study_options_form.Display($('#content'));
			$('#header_text').html('Choose Study Options');
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	StudyOptions2 : function(post_data)
	{
		if (post_data['study_type'])
		{
			//Save study options for next step
			Pages.study_options = post_data;

			if (post_data['study_type'] == 'single_box')
			{
				Pages.database.GetBoxes({parent_card_set : post_data.set}, function(result, params)
				{
					//Get options
					var options = {};
					for (i = 0; i < result.length; ++i)
						options[result[i].id] = result[i].name;

					var study_options_form = new Form(Pages.Study, 'box_form', 'Continue');
					study_options_form.AddSelect('box', 'Box', options, null);
					$('#content').html(''); //Clear content area
					study_options_form.Display($('#content'));
					$('#header_text').html('Choose Box to Study');
				},
				function(type, message)
				{
					if (type == 'network')
						Pages.NetworkError(message);
					else
						Pages.FatalError(message);
				});
			}
			else
				Pages.Study({});
		}
	},

	Study : function(post_data)
	{
		for (attr in post_data)
			Pages.study_options[attr] = post_data[attr];
		Study.Begin(Pages.study_options, Pages.database);
	},

	//Edit

	EditSetSelect : function()
	{
		Pages.database.GetSets({}, function(result, params)
		{
			//Get options
			var options = {};
			for (i = 0; i < result.length; ++i)
				options[result[i].id] = result[i].name;

			var set_select_form = new Form(Pages.EditSet, 'box_form', 'Edit');
			set_select_form.AddSelect('set', 'Set', options, null);
			$('#content').html(''); //Clear content area
			set_select_form.Display($('#content'));
			$('#header_text').html('Select Set to Edit');
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	EditSet : function(post_data)
	{
		Pages.database.GetSets({'id' : post_data.id}, function(result, params)
		{
			$('#content').html('<div id="form" /><div id="menu" />');

			var edit_set_form = new Form(Pages.EditSetSubmit, 'box_form', 'Edit');
			edit_set_form.AddText('name', 'Name', result[0].name, 60);
			edit_set_form.Display($('#form'));

			var menu_content =
				'<a href="javascript:Pages.NewCard()" class="menu_item">New Card</a>' +
				'<a href="javascript:Pages.EditCard()" class="menu_item">Edit Card</a>' +
				'<a href="javascript:Pages.NewBox()" class="menu_item">New Box</a>' +
				'<a href="javascript:Pages.EditBox()" class="menu_item">Edit Box</a>' +
				'<a href="javascript:Pages.CheckOut(' + post_data.id + ', Pages.CheckOutSuccess)" class="menu_item">Check Out Set</a>';
			$('#menu').html(menu_content);
			$('#header_text').html('Edit Set - ' + result[0].name);
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	CheckOut : function(id)
	{
		Pages.database.CheckOut(id, Pages.CheckOutSuccess, function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	CheckOutSuccess : function()
	{
		$('#content').html('Success! Returning home...');
		$('#header_text').html('Check Out Successful');
		setTimeout(Pages.Centre, 3000);
	},

	//Settings

	Settings : function()
	{
		var menu_content =
			(Pages.database.is_online ?
				'<a href="javascript:Pages.SwitchOnlineStatus(false)" class="menu_item">Switch Offline</a>' :
				'<a href="javascript:Pages.SwitchOnlineStatus(true)" class="menu_item">Switch Online</a>');
		$('#content').html(menu_content);
		$('#header_text').html('Settings');
	},

	SwitchOnlineStatus : function(online)
	{
		if (online)
		{
			Pages.database.ToggleNetworkStatus(true, function()
			{
				$('#content').html('Switched to online mode. Returning home...');
				$('#header_text').html('Online Mode');
				setTimeout(Pages.Centre, 3000);
			},
			function(type, message)
			{
				Pages.FatalError(message);
			});
		}
		else
		{
			Pages.database.ToggleNetworkStatus(false, function()
			{
				$('#content').html('Switched to offline mode. Returning home...');
				$('#header_text').html('Offline Mode');
				setTimeout(Pages.Centre, 3000);
			},
			function(type, message)
			{
				Pages.FatalError(message);
			});
		}
	},

	FatalError : function(message)
	{
		var content = '<p>A fatal error has occurred: ' + message + '</p>';
		$('#content').html(content);
		$('#header_text').html('Fatal Error');
	},

	NetworkError : function(message)
	{
		var content =
			'<p>A network error has occurred: ' + message + '<br />' +
			'Would you like to switch to offline mode? (No will return you to Centre)</p>' +
			'<a href="javascript:Pages.SwitchOnlineStatus(false)" class="menu_item">Yes</a>' +
			'<a href="javascript:Pages.Centre();" class="menu_item">No</a>';
		$('#content').html(content);
		$('#header_text').html('Network Error');
	},

	Start : function()
	{
		Pages.database = new Database(function()
		{
			Pages.Login();
		},
		function(type, message)
		{
			Pages.FatalError(message + ' [Error type: ' + type + ']');
		});
	},
}
