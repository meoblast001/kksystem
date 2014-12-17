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

class Cardset < ActiveRecord::Base
  CLIENT_MODEL_ATTRIBUTES = [:name, :reintroduce_cards,
    :reintroduce_cards_amount, :reintroduce_cards_frequency,
    :last_reintroduced_cards]

  belongs_to :user
  has_many :cardboxes, :dependent => :destroy
  has_many :cards, :dependent => :destroy

  validates_presence_of :user_id, :name
  validates_inclusion_of :reintroduce_cards, :in => [true, false]
  validates :reintroduce_cards_amount, :reintroduce_cards_frequency,
            :numericality => { :greater_than => 0 }, :allow_nil => true
end
