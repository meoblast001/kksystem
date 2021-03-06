# Copyright (C) 2014 Braden Walters
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

class Cardbox < ActiveRecord::Base
  CLIENT_MODEL_ATTRIBUTES = [:name, :review_frequency, :last_reviewed]

  belongs_to :user
  belongs_to :cardset
  has_many :cards, :foreign_key => 'current_cardbox_id', :dependent => :destroy

  validates_presence_of :user_id, :cardset_id, :name, :review_frequency
  validates :review_frequency, :numericality => { :greater_than => 0 }

  def self.search(str)
    where { name.matches("%#{str}%") | (review_frequency == str) }
  end
end
