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

MIGRATIONS = [
	//Initial migration
	{
		id : 'init',
		migrate : function(db)
		{
			db.transaction(function(transaction)
			{
				transaction.executeSql('CREATE TABLE cardset (' +
					'id INT,' +
					'name VARCHAR(60),' +
					'modified BOOLEAN);');
				transaction.executeSql('CREATE TABLE cardbox (' +
					'id INT,' +
					'name VARCHAR(60),' +
					'parent_card_set INT,' +
					'review_frequency INT,' +
					'last_reviewed TIMESTAMP,' +
					'modified BOOLEAN,' +
					'FOREIGN KEY (parent_card_set) REFERENCES cardset(id));');
				transaction.executeSql('CREATE TABLE card (' +
					'id INT,' +
					'front TEXT,' +
					'back TEXT,' +
					'parent_card_set INT,' +
					'current_box INT,' +
					'modified BOOLEAN,' +
					'FOREIGN KEY (parent_card_set) REFERENCES cardset(id),' +
					'FOREIGN KEY (current_box) REFERENCES cardset(id));');
			});
		}
	},
];
