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
  //Login form
  login : function()
    {
      return {
          on_submit : Pages.OnlineLoginSubmit,
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
              },
              {
                type : 'submit',
                name : 'submit',
                value : 'Submit'
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
              },
              {
                type : 'submit',
                name : 'submit',
                value : 'Continue'
              }
            ]
        };
    }
};
