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

namespace :django do
  desc "Migrates Django KKSystem database at migration 0003 to Rails " +
       "KKSystem database at initial migration."
  task :import, [:current_env, :django_env] => :environment do |t, args|
    config = YAML.load_file(File.dirname(__FILE__) +
                            '/../../config/database.yml')
    current_env = config[args[:current_env]]
    django_env = config[args[:django_env]]

    if current_env.nil? or django_env.nil?
      puts "This environment does not exist. Please include two arguments: " +
           "the environment with the current database and the environment " +
           "with the Django database."
      exit
    end

    module Django
      class User < ActiveRecord::Base
        self.table_name = "auth_user"

        def self.connect(env)
          establish_connection(env)
        end
      end

      class Cardset < ActiveRecord::Base
        self.table_name = "karteikarten_cardset"

        def self.connect(env)
          establish_connection(env)
        end
      end

      class Cardbox < ActiveRecord::Base
        self.table_name = "karteikarten_cardbox"

        def self.connect(env)
          establish_connection(env)
        end
      end

      class Card < ActiveRecord::Base
        self.table_name = "karteikarten_card"

        def self.connect(env)
          establish_connection(env)
        end
      end
    end

    #Disable user password requirement.
    class User
      def password_required?
        false
      end
    end

    ActiveRecord::Base.establish_connection(current_env)
    Django::User.connect(django_env)
    Django::Cardset.connect(django_env)
    Django::Cardbox.connect(django_env)
    Django::Card.connect(django_env)

    ActiveRecord::Base.transaction do
      Django::User.all.each do |dj_record|
        User.new.tap do |user|
          user.id = dj_record.id
          user.username = dj_record.username
          user.email = dj_record.email
          user.encrypted_password = nil
          user.must_reset_password = true
          user.created_at = dj_record.date_joined
          user.updated_at = dj_record.last_login
        end.save!
      end

      Django::Cardset.all.each do |dj_record|
        Cardset.new.tap do |cardset|
          cardset.id = dj_record.id
          cardset.user_id = dj_record.owner_id
          cardset.name = dj_record.name
          cardset.reintroduce_cards = dj_record.reintroduce_cards
          cardset.reintroduce_cards_amount = dj_record.reintroduce_cards_amount
          cardset.reintroduce_cards_frequency =
            dj_record.reintroduce_cards_frequency
          cardset.last_reintroduced_cards = dj_record.last_reintroduced_cards
          cardset.created_at = DateTime.now
          cardset.updated_at = DateTime.now
        end.save!
      end

      Django::Cardbox.all.each do |dj_record|
        Cardbox.new.tap do |cardbox|
          cardbox.id = dj_record.id
          cardbox.user_id = dj_record.owner_id
          cardbox.cardset_id = dj_record.parent_card_set_id
          cardbox.name = dj_record.name
          cardbox.review_frequency = dj_record.review_frequency
          cardbox.last_reviewed = dj_record.last_reviewed
        end.save!
      end

      Django::Card.all.each do |dj_record|
        Card.new.tap do |card|
          card.id = dj_record.id
          card.user_id = dj_record.owner_id
          card.cardset_id = dj_record.parent_card_set_id
          card.current_cardbox_id = dj_record.current_box_id
          card.front = dj_record.front
          card.back = dj_record.back
        end.save!
      end
    end

    puts "Completed import successfully."
  end
end
