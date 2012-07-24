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

	Logout : function()
	{
		function LocalLogout()
		{
			Pages.database.Logout();
			Pages.Login();
		}

		if (Pages.database.is_online)
		{
			$.ajax({
				type : 'GET',
				url : SITE_ROOT + '/accounts/logout/',
				dataType : 'json',
				success : function(result)
				{
					LocalLogout();
				},
				error : function(jq_xhr, text_status, error_thrown)
				{
					alert('Error: ' + text_status);
				}
			});
		}
		else
			LocalLogout();
	},

	//Centre

	Centre : function()
	{
		var content =
			'<a href="javascript:Pages.StudyOptions()" class="menu_item">Study</a>' +
			'<a href="javascript:Pages.EditSetSelect()" class="menu_item">Edit</a>' +
			'<a href="javascript:Pages.Settings()" class="menu_item">Settings</a>' +
			'<a href="javascript:Pages.Logout()" class="menu_item">Exit</a>';
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
			set_select_form.AddSelect('cardset', 'Set', options, null);
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
		Pages.database.GetSets({'id' : post_data.cardset}, function(result, params)
		{
			$('#content').html('<div id="form" /><div id="menu" />');

			var edit_set_form = new Form(Pages.EditSetSubmit, 'box_form', 'Edit');
			edit_set_form.AddHidden('id', post_data.cardset);
			edit_set_form.AddText('name', 'Name', result[0].name, 60);
			edit_set_form.Display($('#form'));

			var menu_content =
				'<a href="javascript:Pages.EditCard(\'new\', ' + post_data.cardset + ')" class="menu_item">New Card</a>' +
				'<a href="javascript:Pages.ViewCardsBySet(' + post_data.cardset + ', 0)" class="menu_item">Edit Card</a>' +
				'<a href="javascript:Pages.NewBox()" class="menu_item">New Box</a>' +
				'<a href="javascript:Pages.ViewBoxesBySet(' + post_data.cardset + ', 0)" class="menu_item">Edit Box</a>' +
				'<a href="javascript:Pages.CheckOut(' + post_data.cardset + ', Pages.CheckOutSuccess)" class="menu_item">Check Out Set</a>' +
				'<a href="javascript:Pages.CheckIn(' + post_data.cardset + ', Pages.CheckInSuccess)" class="menu_item">Check In Set</a>';
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

	EditSetSubmit : function(post_data)
	{
		var id = post_data['id'];
		delete post_data['id'];
		Pages.database.ModifySet(id, post_data, function()
		{
			$('#content').html('Edited successfully. Returning to edit set page...');
			$('#header_text').html('Success');
			setTimeout(function()
			{
				Pages.EditSet({'cardset' : id});
			}, 3000);
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	ViewCardsBySet : function(cardset_id, start)
	{
		Pages.database.GetCards({'parent_card_set' : cardset_id}, function(results)
		{
			var menu_content = '';
			for (var i = 0; i < results.length; ++i)
				menu_content += '<a href="javascript:Pages.EditCard(\'edit\', ' + results[i]['id'] + ')" class="menu_item">' + results[i]['front'] + '</a>';
			$('#content').html(menu_content);
			$('#header_text').html('Cards by Set');
		},
		function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		}, start, start + 10);
	},

	EditCard : function(type, id)
	{
		function GenerateForm(card_results)
		{
			Pages.database.GetBoxes({'parent_card_set' : card_results[0]['parent_card_set']}, function(box_results)
			{
				//Get options
				var options = {};
				for (i = 0; i < box_results.length; ++i)
					options[box_results[i].id] = box_results[i].name;

				$('#content').html('');
				var edit_card_form = new Form(Pages.EditCardSubmit, 'box_form', 'Edit');
				edit_card_form.AddHidden('type', type);
				edit_card_form.AddHidden('id', id);
				edit_card_form.AddTextarea('front', 'Front', card_results[0]['front']);
				edit_card_form.AddTextarea('back', 'Back', card_results[0]['back']);
				edit_card_form.AddSelect('current_box', 'Current Box', options, card_results[0]['current_box']);
				edit_card_form.Display($('#content'));
				$('#header_text').html('Edit Card');
			},
			function(type, message)
			{
				if (type == 'network')
					Pages.NetworkError(message);
				else
					Pages.FatalError(message);
			});
		}

		if (type == 'new')
			GenerateForm([{'front' : '', 'back' : '', 'current_box' : null}]);
		else //type == 'edit'
		{
			Pages.database.GetCards({'id' : id}, function(card_results)
			{
				GenerateForm(card_results);
			},
			function(type, message)
			{
				if (type == 'network')
					Pages.NetworkError(message);
				else
					Pages.FatalError(message);
			});
		}
	},

	EditCardSubmit : function(post_data)
	{
		var id = post_data['id']; //If type == 'new', set ID; If type == 'edit', card ID
		var type = post_data['type'];
		delete post_data['id'];
		delete post_data['type'];
		if (type == 'new')
			post_data['parent_card_set'] = id;
		Pages.database.ModifyCard(type == 'edit' ? id : null, post_data, function()
		{
			$('#header_text').html('Success');
			if (type == 'new')
			{
				$('#content').html('Created successfully. Returning to edit set page...');
				setTimeout(function()
				{
					Pages.EditSet({'cardset' : id});
				}, 3000);
			}
			else if (type == 'edit')
			{
				$('#content').html('Edited successfully. Returning to edit set page...');
				setTimeout(function()
				{
					Pages.database.GetCards({'id' : id}, function(results)
					{
						Pages.EditSet({'cardset' : results[0]['parent_card_set']});
					},
					function(type, message)
					{
						if (type == 'network')
							Pages.NetworkError(message);
						else
							Pages.FatalError(message);
					});
				}, 3000);
			}
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

	CheckIn : function(id)
	{
		Pages.database.CheckIn(id, Pages.CheckInSuccess, function(type, message)
		{
			if (type == 'network')
				Pages.NetworkError(message);
			else
				Pages.FatalError(message);
		});
	},

	CheckInSuccess : function()
	{
		$('#content').html('Success! Returning home...');
		$('#header_text').html('Check In Successful');
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
