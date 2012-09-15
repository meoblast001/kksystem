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

/**
Database which communicates with the remote and local database to submit and
retrieve data.
*/
var Database = (function()
{
  /**
  Constructs database.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs.
  */
  function Database(success_callback, error_callback)
  {
    this.is_online = true;
    this.current_user = null;
    var _this = this;
    this.local_db = new LocalDatabaseWebSQL('karteikartensystem', '1.0',
      'Karteikartensystem', 200000, success_callback, function(type, message)
      {
        if (type == 'not-supported')
          _this.local_db = null;
        else
          error_callback(type, message);
      });
  }

  /**
  Makes AJAX POST request.
  @param post_data Object containing data to POST.
  @param success_callback Function to call following the request. Takes one
    parameter: results or ID of item updated or created.
  @param error_callback Function to call following an error. Takes two
    parameters: the error type (Possible values: 'network' or 'server') and the
    error message.
  @param select If true, select; If false, update.
  */
  function AJAX(post_data, success_callback, error_callback, select)
  {
    $.ajax({
        type : 'POST',
        url : SITE_ROOT + '/ajax/',
        data : post_data,
        dataType : 'json',
        success : function(result)
          {
            if (result['status'] == 'success')
            {
              if (select)
                success_callback(result['result']);
              else
                success_callback(result['id']);
            }
            else if (result['status'] == 'fail')
              error_callback('server', result['message']);
          },
        error : function(jq_xhr, text_status, error_thrown)
          {
            error_callback('network', text_status);
          },
      });
  }

  /**
  Log a user into the system. This does not perform any networking; Uses only
  the local database.
  @param username Name of user being logged into the system.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs. Takes two
    parameters: the error type (Possible values: 'local-db') and the error
    message.
  */
  Database.prototype.LoginOnline = function(username, success_callback,
                                            error_callback)
  {
    if (this.local_db === null)
    {
      this.current_user = {id : null, username : username};
      success_callback();
      return;
    }

    var _this = this;
    this.local_db.Select('user', {username : username}, null, null,
      function(results)
      {
        if (results.length > 0)
        {
          var first_row = results[0];
          _this.current_user = {
              id : first_row['id'],
              username : first_row['username']
            };
          _this.is_online = !first_row['is_offline'];
          success_callback();
        }
        else
        {
          _this.local_db.Insert('user', {
              username : username,
              is_offline : false
            },
            function(id)
            {
              _this.local_db.Max('user', 'id', function(max)
                {
                  _this.current_user = {id : max, username : username};
                  _this.is_online = true;
                  success_callback();
                }, error_callback);
            }, error_callback);
        }
      }, error_callback);
  }

  /**
  Log an offline user into the system.
  @param id User ID of the user.
  @param success_callback Function to call if successful.
  @param error_callback Function to call if an error occurs. Takes 2 parameters:
    The type of error (Possible values: 'no-local-db', 'local-db', or
    'user-not-found') and the error message.
  */
  Database.prototype.LoginOffline = function(id, success_callback,
                                             error_callback)
  {
    if (this.local_db === null)
    {
      error_callback('no-local-db', 'No local database');
      return;
    }

    var _this = this;
    this.local_db.Select('user', {id : id, is_offline : true}, null, null,
      function(results)
      {
        if (results.length > 0)
        {
          var user = results[0];
          _this.current_user = {id : user['id'], username : user['username']};
          _this.is_online = false;
          success_callback();
        }
        else
          error_callback('user-not-found', 'User was not found');
      }, error_callback);
  }

  /**
  Logs the current user out of the system. This does not perform any networking;
  Uses only the local database.
  */
  Database.prototype.Logout = function()
  {
    this.current_user = null;
  }

  /**
  Toggles network status online or offline.
  @param online True if toggling online; False if toggling offline.
  @param success_callback Function to call if successful. Takes no parameters.
  @param error_callback Function to call if an error occurs. Takes two
    parameters: the error type (Possible values: 'local-db', 'no-local-db') and
    the error message.
  */
  Database.prototype.ToggleNetworkStatus = function(online, success_callback,
                                                    error_callback)
  {
    if (this.local_db === null)
    {
      error_callback('no-local-db', 'No local database');
      return;
    }

    var _this = this;
    this.local_db.Update('user', this.current_user.id,
      {is_offline : online ? 0 : 1}, function()
      {
        _this.is_online = online;
        success_callback();
      }, error_callback);
  }

  /**
  Get a list of users in the local database with a particular network status.
  @param online True if query should look for online users, false if query
    should look for offline users.
  @param Function to call if successful. Takes 1 parameter: An array of objects
    containing results.
  @param Function to call if an error occurs. Takes 2 parameters: The error type
    (Possible values: 'no-local-db' or 'local-db') and the error message.
  */
  Database.prototype.GetUsersByNetworkStatus = function(online,
    success_callback, error_callback)
  {
    if (this.local_db === null)
    {
      error_callback('no-local-db', 'No local database.');
      return;
    }
    this.local_db.Select('user', {is_offline : !online}, null, null,
                         success_callback, error_callback);
  }

  /**
  Download all information related to a cardset and store it in the local
  database.
  @param set_id ID of set to download.
  @param success_callback Function to call if successful.
  @param error_callback Funciton to call if an error occurs. Takes 2 parameters:
    The error type (Possible values: 'no-local-db', 'local-db', or 'network')
    and the error message.
  */
  Database.prototype.CheckOut = function(set_id, success_callback,
                                         error_callback)
  {
    if (this.local_db === null)
    {
      error_callback('no-local-db', 'No local database.');
      return;
    }

    var _this =  this;
    var already_failed = false;
    var num_boxes_processed = 0, num_boxes_to_process = 0;
    var num_cards_processed = 0, num_cards_to_process = 0;

    //Generates a function to insert set data from AJAX into the database
    function GenerateSetTransactionFunction(ajax_data, i)
    {
      return function(success_callback, error_callback)
      {
        _this.local_db.Count('cardset', {id : ajax_data[i]['id']},
          function(count)
          {
            //Insert if does not already exist
            if (count == 0)
            {
              var attr = {
                  id : ajax_data[i]['id'],
                  owner : _this.current_user['id'],
                  name : ajax_data[i]['name'],
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Insert('cardset', attr, function()
                {
                  if (!already_failed)
                    success_callback(i);
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
            //Update if exists
            else
            {
              var attr = {
                  name: ajax_data[i]['name'],
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Update('cardset', ajax_data[i]['id'], attr,
                function()
                {
                  if (!already_failed)
                    success_callback(i);
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
          },
          function(type, message)
          {
            if (!already_failed)
              error_callback(type, message);
            already_failed = true;
          });
      };
    }

    //Generates a function to insert box data from AJAX into the database
    function GenerateBoxTransactionFunction(ajax_data, i)
    {
      return function()
      {
        _this.local_db.Count('cardbox', {id : ajax_data[i]['id']},
          function(count)
          {
            //Insert if does not already exist
            if (count == 0)
            {
              var attr = {
                  id : ajax_data[i]['id'],
                  owner : _this.current_user['id'],
                  name : ajax_data[i]['name'],
                  parent_card_set : ajax_data[i]['parent_card_set'],
                  review_frequency : ajax_data[i]['review_frequency'],
                  last_reviewed : new Date(ajax_data[i]['last_reviewed'] *
                                           1000),
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Insert('cardbox', attr, function()
                {
                  ++num_boxes_processed;
                  if (num_boxes_processed == num_boxes_to_process &&
                      num_cards_processed == num_cards_to_process &&
                      !already_failed)
                    success_callback();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
            //Update if exists
            else
            {
              var attr = {
                  name : ajax_data[i]['name'],
                  parent_card_set : ajax_data[i]['parent_card_set'],
                  review_frequency : ajax_data[i]['review_frequency'],
                  last_reviewed : new Date(ajax_data[i]['last_reviewed'] *
                                           1000),
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Update('cardbox', ajax_data[i]['id'], attr,
                function()
                {
                  ++num_boxes_processed;
                  if (num_boxes_processed == num_boxes_to_process &&
                      num_cards_processed == num_cards_to_process &&
                      !already_failed)
                    success_callback();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
          },
          function(type, message)
          {
            if (!already_failed)
              error_callback(type, message);
            already_failed = true;
          });
      };
    }

    //Generates a function to insert card data from AJAX into the database
    function GenerateCardTransactionFunction(ajax_data, i)
    {
      return function()
      {
        _this.local_db.Count('card', {id : ajax_data[i]['id']}, function(count)
          {
            //Insert if does not already exist
            if (count == 0)
            {
              var attr = {
                  id : ajax_data[i]['id'],
                  owner : _this.current_user['id'],
                  front : ajax_data[i]['front'],
                  back : ajax_data[i]['back'],
                  parent_card_set : ajax_data[i]['parent_card_set'],
                  current_box : ajax_data[i]['current_box'],
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Insert('card', attr, function()
                {
                  ++num_cards_processed;
                  if (num_boxes_processed == num_boxes_to_process &&
                      num_cards_processed == num_cards_to_process &&
                      !already_failed)
                    success_callback();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
            else
            {
              var attr = {
                  front : ajax_data[i]['front'],
                  back : ajax_data[i]['back'],
                  parent_card_set : ajax_data[i]['parent_card_set'],
                  current_box : ajax_data[i]['current_box'],
                  modified : false,
                  is_new : false,
                };
              _this.local_db.Update('card', ajax_data[i]['id'], attr, function()
                {
                  ++num_cards_processed;
                  if (num_boxes_processed == num_boxes_to_process &&
                      num_cards_processed == num_cards_to_process &&
                      !already_failed)
                    success_callback();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            }
          },
          function(type, message)
          {
            if (!already_failed)
              error_callback(type, message);
            already_failed = true;
          });
      };
    }

    //Check out set
    var set_post_data = {
        csrfmiddlewaretoken : CSRF_TOKEN,
        type : 'get-cardsets',
        params : JSON.stringify({id : set_id})
      };
    AJAX(set_post_data, function(results)
      {
        for (var i = 0; i < results.length; ++i)
        {
          GenerateSetTransactionFunction(results, i)(function(i)
            {
              //Check out boxes
              var box_post_data = {
                  csrfmiddlewaretoken : CSRF_TOKEN,
                  type : 'get-cardboxes',
                  params : JSON.stringify({parent_card_set : results[i]['id']})
                };
              AJAX(box_post_data, function(results)
                {
                  num_boxes_to_process = results.length;
                  for (var i = 0; i < results.length; ++i)
                    GenerateBoxTransactionFunction(results, i)();
                }, null, true);

              //Check out cards
              var card_post_data = {
                  csrfmiddlewaretoken : CSRF_TOKEN,
                  type : 'get-cards',
                  params : JSON.stringify({parent_card_set : results[i]['id']})
                };
              AJAX(card_post_data, function(results)
              {
                num_cards_to_process = results.length;
                for (var i = 0; i < results.length; ++i)
                  GenerateCardTransactionFunction(results, i)();
              },
              function(type, message)
              {
                if (!already_failed)
                  error_callback(type, message);
                already_failed = true;
              }, true);
            },
            function(type, message)
            {
              if (!already_failed)
                error_callback(type, message);
              already_failed = true;
            });
        }
      }, error_callback, true);
  }

  /**
  Upload all information related to a cardset from the local database.
  @param set_id ID of set to upload.
  @param success_callback Function to call if successful.
  @param error_callback Funciton to call if an error occurs. Takes 2 parameters:
    The error type (Possible values: 'no-local-db', 'local-db', or 'network')
    and the error message.
  */
  Database.prototype.CheckIn = function(set_id, success_callback,
                                        error_callback)
  {
    if (this.local_db === null)
    {
      error_callback('no-local-db', 'No local database.');
      return;
    }

    var _this = this;
    var already_failed = false;
    var num_boxes_processed = 0, num_boxes_to_process = 0;
    var num_cards_processed = 0, num_cards_to_process = 0;

    //Generates a function to submit set data from the database into AJAX
    function GenerateSetAJAXFunction(local_db_data, i)
    {
      return function(callback)
        {
          var attributes = {
              name : local_db_data[i]['name'],
              id : local_db_data[i]['is_new'] ==
                   1 ? null /*New*/ : local_db_data[i]['id'] /*Existing*/,
            };
          var post_data = {
              csrfmiddlewaretoken : CSRF_TOKEN,
              type : 'modify-cardset',
              params : JSON.stringify(attributes)
            };
          AJAX(post_data, function(id)
            {
              _this.local_db.Update('cardset', id, {
                  modified : false,
                  is_new : false
                }, function()
                {
                  if (!already_failed)
                    callback(i);
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            },
            function(type, message)
            {
              if (!already_failed)
                error_callback(type, message);
              already_failed = true;
            }, false);
        };
    }

    //Generates a function to submit box data from the database into AJAX
    function GenerateBoxAJAXFunction(local_db_data, i)
    {
      return function()
      {
        var attributes = {
            name : local_db_data[i]['name'],
            parent_card_set : local_db_data[i]['parent_card_set'],
            review_frequency : local_db_data[i]['review_frequency'],
            last_reviewed :
              Math.round(local_db_data[i]['last_reviewed'].getTime() / 1000),
            id : local_db_data[i]['is_new'] == 1 ?
                 null /*New*/ : local_db_data[i]['id'] /*Existing*/,
          };
        var post_data = {
            csrfmiddlewaretoken : CSRF_TOKEN,
            type : 'modify-cardbox',
            params : JSON.stringify(attributes)
          };
        AJAX(post_data, function(id)
          {
            _this.local_db.Update('cardbox', id, {
                modified : false,
                is_new : false}, function()
              {
                ++num_boxes_processed;
                if (num_boxes_processed == num_boxes_to_process &&
                    num_cards_processed == num_cards_to_process &&
                    !already_failed)
                  success_callback();
              },
              function(type, message)
              {
                if (!already_failed)
                  error_callback(type, message);
                already_failed = true;
              });
          },
          function(type, message)
          {
            if (!already_failed)
              error_callback(type, message);
            already_failed = true;
          }, false);
      }
    }

    //Generates a function to submit card data from the database into AJAX
    function GenerateCardAJAXFunction(local_db_data, i)
    {
      return function()
      {
        var attributes = {
            front : local_db_data[i]['front'],
            back : local_db_data[i]['back'],
            parent_card_set : local_db_data[i]['parent_card_set'],
            current_box : local_db_data[i]['current_box'],
            id : local_db_data[i]['is_new'] == 1 ?
                 null /*New*/ : local_db_data[i]['id'] /*Existing*/,
          };
        var post_data = {
            csrfmiddlewaretoken : CSRF_TOKEN,
            type : 'modify-card',
            params : JSON.stringify(attributes)
          };
        AJAX(post_data, function(id)
          {
            _this.local_db.Update('card', id, {
                modified : false,
                is_new : false
              }, function()
              {
                ++num_cards_processed;
                if (num_boxes_processed == num_boxes_to_process &&
                    num_cards_processed == num_cards_to_process &&
                    !already_failed)
                  success_callback();
              },
              function(type, message)
              {
                if (!already_failed)
                  error_callback(type, message);
                already_failed = true;
              });
          },
          function(type, message)
          {
            if (!already_failed)
              error_callback(type, message);
            already_failed = true;
          }, false);
      }
    }

    //Check in set
    _this.local_db.Select('cardset', {id : set_id}, null, null,
      function(cardset_results)
      {
        for (var i = 0; i < cardset_results.length; ++i)
        {
          GenerateSetAJAXFunction(cardset_results, i)(function(i)
            {
              //Check in boxes
              _this.local_db.Select('cardbox', {
                  parent_card_set : set_id,
                  modified : true
                }, null, null, function(cardbox_results)
                {
                  num_boxes_to_process = cardbox_results.length;
                  for (var i = 0; i < cardbox_results.length; ++i)
                    GenerateBoxAJAXFunction(cardbox_results, i)();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });

              //Check in cards
              _this.local_db.Select('card', {
                  parent_card_set : set_id,
                  modified : true
                }, null, null, function(card_results)
                {
                  num_cards_to_process = card_results.length;
                  for (var i = 0; i < card_results.length; ++i)
                    GenerateCardAJAXFunction(card_results, i)();
                },
                function(type, message)
                {
                  if (!already_failed)
                    error_callback(type, message);
                  already_failed = true;
                });
            });
        }
      }, error_callback);
  }

  /**
  Finds sets in the database with attributes matching the provided attributes.
  @param attributes Object of attribute/value pairs to match.
  @param success_callback Function called with results, if successful. Takes one
    parameter: results.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db') and
    message.
  @param start Index of result that should be the first element.
  @param end Index following result that should be the last element.
  */
  Database.prototype.GetSets = function(attributes, success_callback,
                                        error_callback, start, end)
  {
    if (this.is_online)
    {
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'get-cardsets',
          params : JSON.stringify(attributes),
          start : start, end : end
        };
      AJAX(post_data, success_callback, error_callback, true);
    }
    else
    {
      attributes['owner'] = this.current_user['id'];
      this.local_db.Select('cardset', attributes,
                           start !== undefined ? start : null,
                           end !== undefined ? end : null,
                           success_callback, error_callback, start, end);
    }
  }

  /**
  Finds boxes in the database with attributes matching the provided attributes.
  @param attributes Object of attribute/value pairs to match.
  @param success_callback Function called with results, if successful. Takes one
    parameter: results.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db') and
    message.
  @param start Index of result that should be the first element.
  @param end Index following result that should be the last element.
  */
  Database.prototype.GetBoxes = function(attributes, success_callback,
                                         error_callback, start, end)
  {
    if (this.is_online)
    {
      if (attributes['last_reviewed'] !== undefined)
        attributes['last_reviewed'] =
          Math.round(attributes['last_reviewed'].getTime() / 1000);
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'get-cardboxes',
          params : JSON.stringify(attributes),
          start : start,
          end : end
        };
      AJAX(post_data, function(results)
        {
          for (var i = 0; i < results.length; ++i)
            if (results[i]['last_reviewed'] !== undefined)
              results[i]['last_reviewed'] =
                new Date(results[i]['last_reviewed'] * 1000);
          success_callback(results);
        }, error_callback, true);
    }
    else
    {
      attributes['owner'] = this.current_user['id'];
      this.local_db.Select('cardbox', attributes,
                           start !== undefined ? start : null,
                           end !== undefined ? end : null,
                           success_callback, error_callback);
    }
  }

  /**
  Finds cards in the database with attributes matching the provided attributes.
  @param attributes Object of attribute/value pairs to match.
  @param success_callback Function called with results, if successful. Takes one
    parameter: results.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db')
    and message.
  @param start Index of result that should be the first element.
  @param end Index following result that should be the last element.
  */
  Database.prototype.GetCards = function(attributes, success_callback,
                                         error_callback, start, end)
  {
    if (this.is_online)
    {
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'get-cards',
          params : JSON.stringify(attributes),
          start : start,
          end : end
        };
      AJAX(post_data, success_callback, error_callback, true);
    }
    else
    {
      attributes['owner'] = this.current_user['id'];
      this.local_db.Select('card', attributes,
                           start !== undefined ? start : null,
                           end !== undefined ? end : null,
                           success_callback, error_callback);
    }
  }

  /**
  Modifies the attributes of a set in the database.
  @param id Primary key of set to modify. If null, create new.
  @param attributes Object of attribute/value pairs containing the attributes
    that should be modified.
  @param success_callback Function called following modification, if successful.
    Takes 1 or no parameters: If new entry, the ID of this entry, else none.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db') and
    message.
  */
  Database.prototype.ModifySet = function(id, attributes, success_callback,
                                          error_callback)
  {
    if (this.is_online)
    {
      attributes['id'] = id;
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'modify-cardset',
          params : JSON.stringify(attributes)
        };
      AJAX(post_data, success_callback, error_callback, false);
    }
    else
    {
      attributes['modified'] = true;
      if (id === null)
      {
        var _this = this;
        this.local_db.Max('cardset', 'id', function(max)
          {
            attributes['id'] = max !== null ? max + 1 : 1;
            attributes['owner'] = _this.current_user['id'];
            attributes['is_new'] = true;
            _this.local_db.Insert('cardset', attributes, success_callback,
                                  error_callback);
          }, error_callback);
      }
      else
        this.local_db.Update('cardset', id, attributes, success_callback,
                             error_callback);
    }
  }

  /**
  Modifies the attributes of a box in the database.
  @param id Primary key of box to modify. If null, create new.
  @param attributes Object of attribute/value pairs containing the attributes
    that should be modified.
  @param success_callback Function called following modification, if successful.
    Takes 1 or no parameters: If new entry, the ID of this entry, else none.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db') and
    message.
  */
  Database.prototype.ModifyBox = function(id, attributes, success_callback,
                                          error_callback)
  {
    if (this.is_online)
    {
      attributes['id'] = id;
      if (attributes['last_reviewed'] !== undefined)
        attributes['last_reviewed'] =
          Math.round(attributes['last_reviewed'].getTime() / 1000);
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'modify-cardbox',
          params : JSON.stringify(attributes)
        };
      AJAX(post_data, success_callback, error_callback, false);
    }
    else
    {
      attributes['modified'] = true;
      if (id === null)
      {
        var _this = this;
        this.local_db.Max('cardbox', 'id', function(max)
          {
            attributes['id'] = max !== null ? max + 1 : 1;
            attributes['owner'] = _this.current_user['id'];
            attributes['is_new'] = true;
            _this.local_db.Insert('cardbox', attributes, success_callback,
                                  error_callback);
          }, error_callback);
      }
      else
        this.local_db.Update('cardbox', id, attributes, success_callback,
                             error_callback);
    }
  }

  /**
  Modifies the attributes of a card in the database.
  @param id Primary key of card to modify. If null, create new.
  @param attributes Object of attribute/value pairs containing the attributes
    that should be modified.
  @param success_callback Function called following modification, if successful.
    Takes 1 or no parameters: If new entry, the ID of this entry, else
    none.
  @param error_callback Function called if error occurs. Takes two parameters:
    the error type (Possible values: 'network', 'server', or 'local-db')
    and message.
  */
  Database.prototype.ModifyCard = function(id, attributes, success_callback,
                                           error_callback)
  {
    if (this.is_online)
    {
      attributes['id'] = id;
      var post_data = {
          csrfmiddlewaretoken : CSRF_TOKEN,
          type : 'modify-card',
          params : JSON.stringify(attributes)
        };
      AJAX(post_data, success_callback, error_callback, false);
    }
    else
    {
      attributes['modified'] = true;
      if (id === null)
      {
        var _this = this;
        this.local_db.Max('card', 'id', function(max)
          {
            attributes['id'] = max !== null ? max + 1 : 1;
            attributes['owner'] = _this.current_user['id'];
            attributes['is_new'] = true;
            _this.local_db.Insert('card', attributes, success_callback,
                                  error_callback);
          }, error_callback);
      }
      else
        this.local_db.Update('card', id, attributes, success_callback,
                             error_callback);
    }
  }

  return Database;
})();
