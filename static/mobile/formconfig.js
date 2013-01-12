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
                label : gettext('username')
              },
              {
                type : 'password',
                name : 'password',
                label : gettext('password')
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('online-login')
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
                      submit_event.nonFieldError(gettext('error') + ': ' +
                                                 text_status);
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
                value : gettext('offline-login')
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
                label : gettext('cardset'),
                options : cardsets
              },
              {
                type : 'radio',
                name : 'study_type',
                label : gettext('study-type'),
                options : {
                    normal : gettext('study-type-normal'),
                    single_box : gettext('study-type-single-box'),
                    no_box : gettext('study-type-no-box')
                  }
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('continue')
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
                label : gettext('cardbox'),
                options : cardboxes
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('continue')
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
                label : gettext('cardset'),
                options : cardsets
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('edit')
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
                label : gettext('name'),
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('submit')
              }
            ],
          on_submit : function(post_data)
            {
              var id = post_data['id'];
              delete post_data['id'];
              Pages.database.ModifySet(id, post_data, function()
                {
                  $('#content').html(gettext('edited-successfully') + ' ' +
                                     gettext('returning-to-edit-set-page'));
                  $('#header_text').html(gettext('success'));
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
                label : gettext('front-side')
              },
              {
                type : 'textarea',
                name : 'back',
                label : gettext('back-side')
              },
              {
                type : 'select',
                name : 'current_box',
                label : gettext('current-box'),
                options : cardboxes
              }
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('submit')
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
                  $('#header_text').html(gettext('success'));
                  if (type == 'new')
                  {
                    $('#content').html(gettext('created-successfully') + ' ' +
                                       gettext('returning-to-edit-set-page'));
                    setTimeout(function()
                      {
                        Pages.EditSet({'cardset' : id});
                      }, 3000);
                  }
                  else if (type == 'edit')
                  {
                    $('#content').html(gettext('edited-successfully') + ' ' +
                                       gettext('returning-to-edit-set-page'));
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
    },
  //Create new box or edit
  editBox : function()
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
                type : 'text',
                name : 'name',
                label : gettext('name')
              },
              {
                type : 'text',
                name : 'review_frequency',
                label : gettext('review-frequency-in-days')
              },
              {
                type : 'hidden',
                name : 'last_reviewed'
              },
            ],
          buttons : [
              {
                type : 'submit',
                name : 'submit',
                value : gettext('submit')
              }
            ],
          on_submit : function(post_data)
            {
              //If type == 'new', set ID; If type == 'edit', box ID
              var id = post_data['id'];
              var type = post_data['type'];
              delete post_data['id'];
              delete post_data['type'];
              post_data['last_reviewed'] =
                new Date(post_data['last_reviewed'] * 1000);
              if (type == 'new')
                post_data['parent_card_set'] = id;
              Pages.database.ModifyBox(type == 'edit' ? id : null, post_data,
                function()
                {
                  $('#header_text').html(gettext('success'));
                  if (type == 'new')
                  {
                    $('#content').html(gettext('created-successfully') + ' ' +
                                       gettext('returning-to-edit-set-page'));
                    setTimeout(function()
                      {
                        Pages.EditSet({'cardset' : id});
                      }, 3000);
                  }
                  else if (type == 'edit')
                  {
                    $('#content').html(gettext('edited-successfully') + ' ' +
                                       gettext('returning-to-edit-set-page'));
                    setTimeout(function()
                      {
                        Pages.database.GetBoxes({'id' : id}, function(results)
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
        }
    }
};
