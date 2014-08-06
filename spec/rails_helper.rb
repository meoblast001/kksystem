ENV["RAILS_ENV"] ||= 'test'
require 'spec_helper'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'capybara/rspec'
include Warden::Test::Helpers

#Requires supporting ruby files with custom matchers and macros, etc, in
#spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
#run as spec files by default. This means that files in spec/support that end
#in _spec.rb will both be required and run as specs, causing the specs to be
#run twice. It is recommended that you do not name files matching this glob to
#end with _spec.rb. You can configure this pattern with the --pattern
#option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
Dir[Rails.root.join("spec/support/**/*.rb")].each { |f| require f }

#Checks for pending migrations before tests are run.
ActiveRecord::Migration.check_pending! if defined?(ActiveRecord::Migration)

RSpec.configure do |config|
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  config.use_transactional_fixtures = false

  #RSpec Rails can automatically mix in different behaviours to your tests
  #based on their file location, for example enabling you to call `get` and
  #`post` in specs under `spec/controllers`.
  #
  #The different available types are documented in the features, such as in
  #https://relishapp.com/rspec/rspec-rails/docs
  config.infer_spec_type_from_file_location!

  #Clean the database after each test.
  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
  end
  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end
  config.before(:each, :js => true) do
    DatabaseCleaner.strategy = :truncation
  end
  config.before(:each) do
    DatabaseCleaner.start
  end
  config.after(:each) do
    DatabaseCleaner.clean
  end

  #Tests need the URL path helpers.
  config.include Rails.application.routes.url_helpers
end
