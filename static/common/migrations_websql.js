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

MIGRATIONS_WEBSQL = [
	//Initial migration
	{
		id : 'init',
		migrate : function(db, success_callback, error_callback)
		{
			var total_queries = 4;
			var completed_queries = 0;
			db.transaction(function(transaction)
			{
				transaction.executeSql('CREATE TABLE user (' +
					'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
					'username VARCHAR(60),' +
					'is_offline BOOLEAN);', [], function(transaction, results)
					{
						++completed_queries;
						if (completed_queries == total_queries)
							success_callback();
					},
					function(transaction, error)
					{
						error_callback('(Create table: user) ' + error.message);
					});
				transaction.executeSql('CREATE TABLE cardset (' +
					'id INTEGER,' +
					'owner INTEGER,' +
					'name VARCHAR(60),' +
					'modified BOOLEAN,' +
					'is_new BOOLEAN,' +
					'FOREIGN KEY (owner) REFERENCES user(id));', [], function(transaction, results)
					{
						++completed_queries;
						if (completed_queries == total_queries)
							success_callback();
					},
					function(transaction, error)
					{
						error_callback('(Create table: cardset) ' + error.message);
					});
				transaction.executeSql('CREATE TABLE cardbox (' +
					'id INTEGER,' +
					'owner INTEGER,' +
					'name VARCHAR(60),' +
					'parent_card_set INTEGER,' +
					'review_frequency INTEGER,' +
					'last_reviewed DATETIME,' +
					'modified BOOLEAN,' +
					'is_new BOOLEAN,' +
					'FOREIGN KEY (owner) REFERENCES user(id),' +
					'FOREIGN KEY (parent_card_set) REFERENCES cardset(id));', [], function(transaction, results)
					{
						++completed_queries;
						if (completed_queries == total_queries)
							success_callback();
					},
					function(transaction, error)
					{
						error_callback('(Create table: cardbox) ' + error.message);
					});
				transaction.executeSql('CREATE TABLE card (' +
					'id INTEGER,' +
					'owner INTEGER,' +
					'front TEXT,' +
					'back TEXT,' +
					'parent_card_set INTEGER,' +
					'current_box INTEGER,' +
					'modified BOOLEAN,' +
					'is_new BOOLEAN,' +
					'FOREIGN KEY (owner) REFERENCES user(id),' +
					'FOREIGN KEY (parent_card_set) REFERENCES cardset(id),' +
					'FOREIGN KEY (current_box) REFERENCES cardset(id));', [], function(transaction, results)
					{
						++completed_queries;
						if (completed_queries == total_queries)
							success_callback();
					},
					function(transaction, error)
					{
						error_callback('(Create table: card) ' + error.message);
					});
			});
		}
	},
];

SCHEMA_WEBSQL = {
	user : {
		id : 'integer',
		username : 'string',
		is_offline : 'boolean'
	},
	cardset : {
		id : 'integer',
		owner : 'integer',
		name : 'string',
		modified : 'boolean',
		is_new : 'boolean',
	},
	cardbox : {
		id : 'integer',
		owner : 'integer',
		name : 'string',
		parent_card_set : 'integer',
		review_frequency : 'integer',
		last_reviewed : 'datetime',
		modified : 'boolean',
		is_new : 'boolean'
	},
	card : {
		id : 'integer',
		owner : 'integer',
		front : 'string',
		back : 'string',
		parent_card_set : 'integer',
		current_box : 'integer',
		modified : 'boolean',
		is_new : 'boolean'
	}
};
