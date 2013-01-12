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

  SetBackButtonFunction : function(callback)
    {
      var back_button = $('#back_button');
      if (callback !== null)
      {
        back_button.unbind('click');
        back_button.bind('click', callback);
        back_button.show();
      }
      else
        back_button.hide();
    },

  //Login

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
      //Clear content area
      var content = $('#content');
      content.html(''); //Clear
      var online_login_form_el = document.createElement('form');
      online_login_form_el.setAttribute('id', 'online_login');
      online_login_form_el.setAttribute('class', 'box_form');
      content[0].appendChild(online_login_form_el);
      var offline_login_form_el = document.createElement('form');
      offline_login_form_el.setAttribute('id', 'offline_login');
      offline_login_form_el.setAttribute('class', 'box_form');
      content[0].appendChild(offline_login_form_el);

      $('#header_text').html('Welcome');
      Pages.SetBackButtonFunction(null);

      var online_login_form =
        new Form(online_login_form_el, FORM_CONFIG.login());

      var offline_login_form

      Pages.database.GetUsersByNetworkStatus(false, function(results)
        {
          var options = {};
          for (var i = 0; i < results.length; ++i)
          {
            var cur_result = results[i];
            options[cur_result['id']] = cur_result['username'];
          }
          var offline_login_form =
            new Form(offline_login_form_el, FORM_CONFIG.offlineLogin(options));
        },
        function(type, message)
        {
          if (type == 'no-local-db')
            $('#offline_login').html(gettext('no-offline-mode-supported'));
          else
            $('#offline_login').html(gettext('offline-mode-error') + ': ' +
                                     message);
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
        '<a href="javascript:Pages.StudyOptions()" ' +
        'class="menu_item">' + gettext('study') + '</a>' +
        '<a href="javascript:Pages.EditSetSelect()" ' +
        'class="menu_item">' + gettext('edit') + '</a>' +
        '<a href="javascript:Pages.Settings()" class="menu_item">' +
        gettext('settings') + '</a>' +
        '<a href="javascript:Pages.Logout()" class="menu_item">' +
        gettext('exit') + '</a>';
      $('#content').html(content);
      $('#header_text').html(gettext('centre'));
      Pages.SetBackButtonFunction(null);
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

          var study_options_form_el = document.createElement('form');
          study_options_form_el.setAttribute('class', 'box_form');
          var study_options_form =
            new Form(study_options_form_el, FORM_CONFIG.studyOptions(options));

          $('#content').html(study_options_form_el);
          $('#header_text').html(gettext('choose-study-options'));
          Pages.SetBackButtonFunction(Pages.Centre);
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
          Pages.database.GetBoxes({parent_card_set : post_data.set},
            function(result, params)
            {
              //Get options
              var options = {};
              for (i = 0; i < result.length; ++i)
                options[result[i].id] = result[i].name;

              var study_options_form_el = document.createElement('form');
              study_options_form_el.setAttribute('class', 'box_form');

              var study_options_form =
                new Form(study_options_form_el,
                         FORM_CONFIG.studyOptionsSingleBox(options));

              $('#content').html(study_options_form_el);
              $('#header_text').html(gettext('choose-box-to-study'));
              Pages.SetBackButtonFunction(Pages.StudyOptions);
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
      Pages.SetBackButtonFunction(null);
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

          var set_select_form_el = document.createElement('form');
          set_select_form_el.setAttribute('class', 'box_form');

          var set_select_form =
            new Form(set_select_form_el, FORM_CONFIG.editSetSelect(options));

          $('#content').html(set_select_form_el);
          $('#header_text').html(gettext('select-set-to-edit'));
          Pages.SetBackButtonFunction(Pages.Centre);
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
      Pages.database.GetSets({'id' : post_data.cardset},
        function(result, params)
        {
          $('#content').html('<div id="form" /><div id="menu" />');

          var edit_set_form_el = document.createElement('form');
          edit_set_form_el.setAttribute('class', 'box_form');

          var edit_set_form = new Form(edit_set_form_el, FORM_CONFIG.editSet());
          edit_set_form.setValues({
              id : post_data.cardset,
              name : result[0].name
            });

          $('#form').html(edit_set_form_el);

          var menu_content =
            '<a href="javascript:Pages.EditCard(\'new\', ' + post_data.cardset +
              ')" class="menu_item">' + gettext('new-card') + '</a>' +
            '<a href="javascript:Pages.ViewCardsBySet(' + post_data.cardset +
              ', 0)" class="menu_item">' + gettext('edit-card') + '</a>' +
            '<a href="javascript:Pages.EditBox(\'new\', ' + post_data.cardset +
              ')" class="menu_item">' + gettext('new-box') + '</a>' +
            '<a href="javascript:Pages.ViewBoxesBySet(' + post_data.cardset +
              ', 0)" class="menu_item">' + gettext('edit-box') + '</a>' +
            '<a href="javascript:Pages.CheckOut(' + post_data.cardset +
              ', Pages.CheckOutSuccess)" class="menu_item">' +
              gettext('check-out-set') + '</a>' +
            '<a href="javascript:Pages.CheckIn(' + post_data.cardset +
              ', Pages.CheckInSuccess)" class="menu_item">' +
              gettext('check-in-set') + '</a>';
          $('#menu').html(menu_content);
          $('#header_text').html('Edit Set - ' + result[0].name);
          Pages.SetBackButtonFunction(Pages.EditSetSelect);
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
      Pages.database.GetCards({'parent_card_set' : cardset_id},
        function(results)
        {
          var menu_content = '';
          var has_next = results.length > 10;
          var has_previous = start > 0;
          var len = has_next ? 10 : results.length;
          for (var i = 0; i < len; ++i)
            menu_content += '<a href="javascript:Pages.EditCard(\'edit\', ' +
                            results[i]['id'] + ')" class="menu_item">' +
                            results[i]['front'] + '</a>';
          if (has_previous)
            menu_content += '<a href="javascript:Pages.ViewCardsBySet(' +
                            cardset_id + ', ' + (start > 10 ? start - 10 : 0) +
                            ')">&lt;Previous&gt;</a> ';
          if (has_next)
            menu_content += '<a href="javascript:Pages.ViewCardsBySet(' +
                            cardset_id + ', ' + (start + 10) +
                            ')">&lt;Next&gt;</a>';

          $('#content').html(menu_content);
          $('#header_text').html(gettext('cards-by-set'));
          Pages.SetBackButtonFunction(function()
            {
              Pages.EditSet({cardset : cardset_id});
            });
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
          else
            Pages.FatalError(message);
        }, start, start + 10 + 1);
    },

  EditCard : function(type, id)
    {
      function GenerateForm(card_results)
      {
        Pages.database.GetBoxes({
            'parent_card_set' : card_results[0]['parent_card_set']
          }, function(box_results)
          {
            //Get options
            var options = {};
            for (i = 0; i < box_results.length; ++i)
              options[box_results[i].id] = box_results[i].name;

            var edit_card_form_el = document.createElement('form');
            edit_card_form_el.setAttribute('class', 'box_form');

            var edit_card_form =
              new Form(edit_card_form_el, FORM_CONFIG.editCard(options));
            edit_card_form.setValues({
                type : type,
                id : id,
                front : card_results[0]['front'],
                back : card_results[0]['back'],
                current_box : card_results[0]['current_box']
              });

            $('#content').html(edit_card_form_el);
            $('#header_text').html(gettext('edit-card'));
            Pages.SetBackButtonFunction(function()
            {
              Pages.EditSet({cardset : card_results[0]['parent_card_set']});
            });
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

  ViewBoxesBySet : function(cardset_id, start)
    {
      Pages.database.GetBoxes({'parent_card_set' : cardset_id},
        function(results)
        {
          var menu_content = '';
          var has_next = results.length > 10;
          var has_previous = start > 0;
          var len = has_next ? 10 : results.length;
          for (var i = 0; i < len; ++i)
            menu_content += '<a href="javascript:Pages.EditBox(\'edit\', ' +
                            results[i]['id'] + ')" class="menu_item">' +
                            results[i]['name'] + '</a>';
          if (has_previous)
            menu_content += '<a href="javascript:Pages.ViewBoxesBySet(' +
                            cardset_id + ', ' + (start > 10 ? start - 10 : 0) +
                            ')">&lt;Previous&gt;</a> ';
          if (has_next)
            menu_content += '<a href="javascript:Pages.ViewBoxesBySet(' +
                            cardset_id + ', ' + (start + 10) +
                            ')">&lt;Next&gt;</a>';

          $('#content').html(menu_content);
          $('#header_text').html(gettext('boxes-by-set'));
          Pages.SetBackButtonFunction(function()
            {
              Pages.EditSet({cardset : cardset_id});
            });
        },
        function(type, message)
        {
          if (type == 'network')
            Pages.NetworkError(message);
          else
            Pages.FatalError(message);
        }, start, start + 10 + 1);
    },

  EditBox : function(type, id)
    {
      function GenerateForm(box_results)
      {
        var edit_box_form_el = document.createElement('form');
        edit_box_form_el.setAttribute('class', 'box_form');

        var edit_box_form = new Form(edit_box_form_el, FORM_CONFIG.editBox());
        edit_box_form.setValues({
            type : type,
            id : id,
            name : box_results[0]['name'],
            review_frequency : box_results[0]['review_frequency'],
            last_reviewed :
              Math.round(box_results[0]['last_reviewed'].getTime() / 1000)
          });

        $('#content').html(edit_box_form_el);
        $('#header_text').html('Edit Box');
        Pages.SetBackButtonFunction(function()
          {
            Pages.EditSet({cardset : box_results[0]['parent_card_set']});
          });
      }

      if (type == 'new')
        GenerateForm([
            {
              'name' : '',
              'review_frequency' : '',
              'last_reviewed' : new Date()
            }
          ]);
      else //type == 'edit'
      {
        Pages.database.GetBoxes({'id' : id}, function(box_results)
          {
            GenerateForm(box_results);
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
      $('#content').html(gettext('success!') + gettext('returning-home'));
      $('#header_text').html(gettext('check-out-successful'));
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
      $('#content').html(gettext('success!') + gettext('returning-home'));
      $('#header_text').html(gettext('check-in-successful'));
      setTimeout(Pages.Centre, 3000);
    },

  //Settings

  Settings : function()
    {
      var menu_content =
        (Pages.database.is_online ?
          '<a href="javascript:Pages.SwitchOnlineStatus(false)" ' +
            'class="menu_item">' + gettext('switch-offline') + '</a>' :
          '<a href="javascript:Pages.SwitchOnlineStatus(true)" ' +
            'class="menu_item">' + gettext('switch-online') + '</a>');
      $('#content').html(menu_content);
      $('#header_text').html('Settings');
      Pages.SetBackButtonFunction(Pages.Centre);
    },

  SwitchOnlineStatus : function(online)
    {
      if (online)
      {
        Pages.database.ToggleNetworkStatus(true, function()
          {
            $('#content').html(gettext('switched-to-online-mode') +
                               gettext('returning-home'));
            $('#header_text').html(gettext('online-mode'));
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
            $('#content').html(gettext('switched-to-offline-mode') +
                               gettext('returning-home'));
            $('#header_text').html(gettext('offline-mode'));
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
      var content = '<p>' + gettext('fatal-error-occurred') + ': ' + message +
                    '</p>';
      $('#content').html(content);
      $('#header_text').html(gettext('fatal-error'));
      Pages.SetBackButtonFunction(null);
    },

  NetworkError : function(message)
    {
      var content =
        '<p>' + gettext('network-error-occurred') + ': ' + message + '<br />' +
        gettext('would-you-like-to-switch-to-offline-mode?') + ' ' +
        '(No will return you to Centre)</p>' +
        '<a href="javascript:Pages.SwitchOnlineStatus(false)" ' +
        'class="menu_item">' + gettext('yes') + '</a>' +
        '<a href="javascript:Pages.Centre();" class="menu_item">' +
        gettext('no') + '</a>';
      $('#content').html(content);
      $('#header_text').html(gettext('network-error'));
      Pages.SetBackButtonFunction(null);
    },

  Start : function()
    {
      function success()
      {
        //Recall function repeatedly until database is not null
        if (Pages.database === null)
        {
          setTimeout(success, 25);
          return;
        }

        Pages.Login();
      }

      Pages.database = new Database(true, success, function(type, message)
        {
          Pages.FatalError(message + ' [' + gettext('error-type') + ': ' +
                           type + ']');
        });
    },
};
