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

	LoginSubmit : function(post_data)
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
					Pages.Centre();
				else if (result['status'] == 'fail')
					alert(result['message']);
			},
			error : function(jq_xhr, text_status, error_thrown)
			{
				alert('Error: ' + text_status);
			}
		});
	},

	Login : function()
	{
		var login_form = new Form(Pages.LoginSubmit, 'box_form', 'Login');
		login_form.AddText('username', 'Username', null, 30);
		login_form.AddPassword('password', 'Password');
		$('#content').html(''); //Clear content area
		login_form.Display($('#content'));
		$('#header_text').html('Welcome');
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
				'<a href="javascript:Pages.database.CheckOut(' + post_data.id + ', Pages.CheckOutSuccess)" class="menu_item">Check Out Set</a>';
			$('#menu').html(menu_content);
			$('#header_text').html('Edit Set - ' + result[0].name);
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
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
			Pages.database.is_online = true;
			$('#content').html('Switched to online mode. Returning home...');
			$('#header_text').html('Online Mode');
			setTimeout(Pages.Centre, 3000);
		}
		else
		{
			Pages.database.is_online = false;
			$('#content').html('Switched to offline mode. Returning home...');
			$('#header_text').html('Offline Mode');
			setTimeout(Pages.Centre, 3000);
		}
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
		Pages.database = new Database();
		Pages.Login();
	},
}
