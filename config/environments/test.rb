require File.expand_path('../../user_settings', __FILE__)

Kksystem::Application.configure do
  #Settings specified here will take precedence over those in
  #config/application.rb.

  config.cache_classes = true
  config.eager_load = false

  config.serve_static_assets = true
  config.static_cache_control = "public, max-age=3600"

  config.consider_all_requests_local = true
  config.action_controller.perform_caching = false

  config.action_dispatch.show_exceptions = false
  config.action_controller.allow_forgery_protection = false
  config.action_mailer.delivery_method = :test

  config.active_support.deprecation = :stderr

  config.assets.debug = true
  config.assets.initialize_on_precompile = true

  #Include user settings.
  include UserSettings::Test
end
