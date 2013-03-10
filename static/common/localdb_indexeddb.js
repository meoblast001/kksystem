/*
Copyright (C) 2013 Braden Walters

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

//Required to use correct IndexedDB implementation.
window.indexedDB = window.indexedDB || window.mozIndexedDB ||
                   window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
                        window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange ||
                     window.msIDBKeyRange;

/**
Manages local IndexedDB database.
*/
var LocalDatabaseIndexedDB = (function()
{
  function LocalDatabaseIndexedDB(database_name, version, migrate_function,
                                  success_callback, error_callback)
  {
    var self = this;
    var request = window.indexedDB.open(database_name, version);
    request.onerror = function(event)
      {
        error_callback('not-supported', gettext('indexeddb-not-available'));
      };
    request.onsuccess = function(event)
      {
        self.database = request.result;
        success_callback();
      };
    request.onupgradeneeded = function(event)
      {
        migrate_function(event.target.result);
      };
  }

  LocalDatabaseIndexedDB.prototype.Select = function(table, attributes, start,
    end, success_callback, error_callback)
  {
    //Separate first attribute from all others.
    var first_attr = null;
    for (attr in attributes)
    {
      first_attr = {
          key : attr,
          value : attributes[attr]
        };
      delete attributes[attr];
      break;
    }

    if (first_attr !== null)
    {
      //Open search on first attribute
      var request = this.database.transaction([table], 'readonly').
                    objectStore(table).index(first_attr['key']).openCursor(
                    IDBKeyRange.only(first_attr['value']));
      var result = [];
      request.onsuccess = function(event)
        {
          var cursor = event.target.result;
          if (cursor)
          {
            //If any attribute in the response does not match the query, don't
            //push to result.
            var will_push = true;
            for (var attr in attributes)
            {
              if (!(attr in cursor.value) ||
                  attributes[attr] != cursor.value[attr])
              {
                will_push = false;
                break;
              }
            }
            if (will_push)
              result.push(cursor.value);
            cursor.continue();
          }
          else
            success_callback(result);
        };
      request.onerror = function(event)
        {
          error_callback('local-db', event.target.errorCode);
        };
    }
  }

  LocalDatabaseIndexedDB.prototype.Insert = function(table, attributes,
    success_callback, error_callback)
  {
    var transaction = this.database.transaction([table], 'readwrite');
    //Catch-all functions for transaction success and failure.
    transaction.oncomplete = function(event)
      {
        success_callback();
      };
    transaction.onerror = function(event)
      {
        error_callback('local-db', event.target.error.name);
      }

    var object_store = transaction.objectStore(table);
    if (object_store === null)
    {
      error_callback('local-db', gettext('table-does-not-exist'));
      return;
    }
    var request = object_store.add(attributes);
    request.onerror = function(event)
      {
        error_callback('local-db', event.target.errorCode);
      };
  }

  return LocalDatabaseIndexedDB;
})();
