require File.expand_path('../boot', __FILE__)

require 'rails/all'

#Require the gems listed in Gemfile, including any gems you've limited to :test,
#:development, or :production.
Bundler.require(:default, Rails.env)

require File.expand_path('../user_settings', __FILE__)

module Kksystem
  VERSION = '3.0.0'

  class Application < Rails::Application
    #Settings in config/environments/* take precedence over those specified
    #here. Application configuration should go into files in config/initializers
    #All .rb files in that directory are automatically loaded.

    #Load all locales from config/locales/**/*.rb,yml.
    config.i18n.load_path +=
      Dir[Rails.root.join('config', 'locales', '**', '*.{rb,yml}').to_s]

    #Include all user-specified settings.
    include UserSettings::Application
  end
end
