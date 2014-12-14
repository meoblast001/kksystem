require File.expand_path('../../user_settings', __FILE__)

Kksystem::Application.configure do
  #Settings specified here will take precedence over those in
  #config/application.rb.

  config.cache_classes = true
  config.eager_load = true

  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.serve_static_assets = false
  config.assets.js_compressor = :uglifier
  config.assets.css_compressor = :sass

  config.assets.initialize_on_precompile = true
  config.assets.compile = false
  config.assets.digest = true
  config.assets.version = Kksystem::VERSION

  config.log_level = :info

  config.cache_store = :mem_cache_store

  config.i18n.fallbacks = true

  config.active_support.deprecation = :notify

  config.log_formatter = ::Logger::Formatter.new

  #Include user settings.
  include UserSettings::Production
end
