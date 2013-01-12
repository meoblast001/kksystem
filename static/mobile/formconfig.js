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

var FORM_CONFIG =
{
  //Online login form
  login : function()
    {
      return {
          fields : [
              {
                type : 'text',
                name : 'username',
                label : 'Username'
              },
              {
                type : 'password',
                name : 'password',
                label : 'Password'
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Online Login'
              }
            ],
          on_submit : function(post_data, submit_event)
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
                        Pages.database.LoginOnline(post_data['username'],
                          function()
                          {
                            Pages.Centre();
                          },
                          function(type, message)
                          {
                            Pages.FatalError(message);
                          });
                      }
                      else if (result['status'] == 'fail')
                        submit_event.nonFieldError(result['message']);
                    },
                  error : function(jq_xhr, text_status, error_thrown)
                    {
                      submit_event.nonFieldError('Error: ' + text_status);
                    }
                });
            }
        };
    },
  //Offline login form
  offlineLogin : function(users)
    {
      return {
          on_submit : Pages.OfflineLoginSubmit,
          fields : [
              {
                type : 'select',
                name : 'user',
                options : users
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Offline Login'
              }
            ]
        };
    },
  //Study options stage 1
  studyOptions : function(cardsets)
    {
      return {
          on_submit : Pages.StudyOptions2,
          fields : [
              {
                type : 'select',
                name : 'set',
                label : 'Cardset',
                options : cardsets
              },
              {
                type : 'radio',
                name : 'study_type',
                label : 'Study Type',
                options : {
                    normal : 'Normal',
                    single_box : 'Practice Single Box',
                    no_box : 'Practice Cards Currently in No Box'
                  }
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Continue'
              }
            ]
        };
    },
  //Study options stage 2 for single box study
  studyOptionsSingleBox : function(cardboxes)
    {
      return {
          on_submit : Pages.Study,
          fields : [
              {
                type : 'select',
                name : 'box',
                label : 'Cardbox',
                options : cardboxes
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Continue'
              }
            ]
        };
    },
  //Select set to edit
  editSetSelect : function(cardsets)
    {
      return {
          on_submit : Pages.EditSet,
          fields : [
              {
                type : 'select',
                name : 'cardset',
                label : 'Cardset',
                options : cardsets
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Edit'
              }
            ]
        };
    },
  //Edit set
  editSet : function()
    {
      return {
          fields : [
              {
                type : 'hidden',
                name : 'id'
              },
              {
                type : 'text',
                name : 'name',
                label : 'Name',
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Submit'
              }
            ],
          on_submit : function(post_data)
            {
              var id = post_data['id'];
              delete post_data['id'];
              Pages.database.ModifySet(id, post_data, function()
                {
                  $('#content').html('Edited successfully. Returning to edit ' +
                                     'set page...');
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
            }
        };
    },
  //Create new card or edit card
  editCard : function(cardboxes)
    {
      return {
          fields : [
              {
                type : 'hidden',
                name : 'type'
              },
              {
                type : 'hidden',
                name : 'id'
              },
              {
                type : 'textarea',
                name : 'front',
                label : 'Front'
              },
              {
                type : 'textarea',
                name : 'back',
                label : 'Back'
              },
              {
                type : 'select',
                name : 'current_box',
                label : 'Current box',
                options : cardboxes
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : 'Submit'
              }
            ],
          on_submit : function(post_data)
            {
              //If type == 'new', set ID; If type == 'edit', card ID
              var id = post_data['id'];
              var type = post_data['type'];
              delete post_data['id'];
              delete post_data['type'];
              if (type == 'new')
                post_data['parent_card_set'] = id;
              Pages.database.ModifyCard(type == 'edit' ? id : null, post_data,
                function()
                {
                  $('#header_text').html('Success');
                  if (type == 'new')
                  {
                    $('#content').html('Created successfully. ' +
                                       'Returning to edit set page...');
                    setTimeout(function()
                      {
                        Pages.EditSet({'cardset' : id});
                      }, 3000);
                  }
                  else if (type == 'edit')
                  {
                    $('#content').html('Edited successfully. ' +
                                       'Returning to edit set page...');
                    setTimeout(function()
                      {
                        Pages.database.GetCards({'id' : id}, function(results)
                          {
                            Pages.EditSet({
                                'cardset' : results[0]['parent_card_set']
                              });
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
            }
        };
    }
};
