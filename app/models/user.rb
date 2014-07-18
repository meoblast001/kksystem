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

class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable, :recoverable, :validatable,
         :confirmable, :authentication_keys => [:login]

  has_many :cardsets
  has_many :cardboxes
  has_many :cards

  validates :username, :email, :uniqueness => { :case_sensitive => false }

  attr_accessor :login

  #Overrides password validation to handle Devise and Django passwords.
  def valid_password?(password)
    #Try Devise password validation.
    begin
      super(password)
    #If that fails, try Django password validation.
    rescue
      pass_parts = self.encrypted_password.split '$'
      begin
        Digest::SHA1.hexdigest(pass_parts[1] + password) == pass_parts[2]
      rescue
        false
      end
    end
  end

  def self.find_first_by_auth_conditions(conds)
    unless conds[:login].nil?
      User.where { (email == conds[:login]) | (username == conds[:login]) }.
           first
    else
      User.where(conds).first
    end
  end
end
