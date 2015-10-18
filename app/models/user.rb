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

  has_many :cardsets, :dependent => :destroy
  has_many :cardboxes, :dependent => :destroy
  has_many :cards, :dependent => :destroy

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

  # Public: Get statistics about how many users registered in a specific time
  #   period.
  #
  # start_time - Time object containing the first week in the statistics.
  # end_time - Time object containing the last week in the statistics.
  #
  # Returns a hash from date strings (format: 'YYYY-MM-DD') representing a day
  # (usually the first) in the week to the amount of users created.
  def self.weekly_creation_stats(start_time, end_time)
    #Query data.
    counts = User.group('CAST(created_at AS DATE)').where { created_at != nil }.
             count

    #Build statistics for each week. Sum query results for each day in that
    #week, because the query returns statistics for dates, not weeks.
    results = Hash.new
    current_week = start_time.to_date
    while current_week <= end_time.to_date
      current_day = current_week.clone
      current_count = 0
      for current_day in self.week_of current_week
        current_count += counts[current_day] if counts.has_key? current_day
        current_day += 1.days
      end
      results[current_week.to_s] = current_count
      current_week = self.week_of(current_week).last + 1.days
    end

    #Convert dates to strings.
    results.inject(Hash.new) do |has, (key, value)|
      results[key.to_s] = value
      results
    end
  end

  private

  def self.week_of(date)
    results = [date]
    current_date = date + 1.days
    while current_date.wday != 0
      results.push current_date
      current_date += 1.days
    end
    return results
  end
end
