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

class Card < ActiveRecord::Base
  CLIENT_MODEL_ATTRIBUTES = [:front, :back, :current_cardbox_id,
                             :front_attachment_url, :back_attachment_url]

  belongs_to :user
  belongs_to :cardset
  belongs_to :current_cardbox, :class_name => 'Cardbox'
  has_many :attachments, :class_name => 'CardAttachment', :dependent => :destroy

  validates_presence_of :user_id, :cardset_id, :front, :back

  def self.search(str)
    where { front.matches("%#{str}%") | back.matches("%#{str}%") }
  end

  #Attachments.
  def front_attachment
    attachments.where(:side => CardAttachment::FRONT).first
  end

  def back_attachment
    attachments.where(:side => CardAttachment::BACK).first
  end

  #Attachment URLs.
  def front_attachment_url
    attachment = front_attachment
    if attachment.nil? then nil else attachment.file.url end
  end

  def back_attachment_url
    attachment = back_attachment
    if attachment.nil? then nil else attachment.file.url end
  end

  # Public: Get statistics about how many cards have been created in a time
  #     period.
  #
  # start_time - Time object containing the first day in the statistics.
  # end_time - Time object containing the last day in the statistics.
  #
  # Returns a hash from date strings (format: 'YYYY-MM-DD') to the amount of
  # cards created.
  def self.daily_creation_stats(start_time, end_time)
    #Query data.
    counts = Card.group('CAST(created_at AS DATE)').where { created_at != nil }.
             count

    #Only days with at least one card are included in the query results. Fill in
    #days with no created cards.
    results = Hash.new
    current_day = start_time.to_date
    while current_day != end_time.to_date
      results[current_day.to_s] =
        if counts.has_key? current_day then counts[current_day] else 0 end
      current_day += 1.days
    end

    #Convert dates to strings.
    results.inject(Hash.new) do |has, (key, value)|
      results[key.to_s] = value
      results
    end
  end
end
