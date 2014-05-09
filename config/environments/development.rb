require File.expand_path('../../user_settings', __FILE__)

Kksystem::Application.configure do
  #Settings specified here will take precedence over those in
  #config/application.rb.

  config.cache_classes = false
  config.eager_load = false

  config.consider_all_requests_local = true
  config.action_controller.perform_caching = false

  config.action_mailer.raise_delivery_errors = false
  config.active_support.deprecation = :log
  config.active_record.migration_error = :page_load

  config.assets.debug = true

  #Include user settings.
  include UserSettings::Development
end
