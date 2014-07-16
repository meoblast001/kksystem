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

    ActiveRecord::Base.establish_connection(current_env)
    Django::User.connect(django_env)
    Django::Cardset.connect(django_env)
    Django::Cardbox.connect(django_env)
    Django::Card.connect(django_env)

    #TODO: Import the data.
    puts Django::User.all.inspect
    puts Django::Cardset.all.inspect
    puts Django::Cardbox.all.inspect
    puts Django::Card.all.inspect
    puts User.all.inspect
  end
end
