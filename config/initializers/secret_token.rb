#Be sure to restart your server when you modify this file.

require File.expand_path('../../user_settings', __FILE__)

Kksystem::Application.config.secret_key_base = UserSettings::SECRET_KEY_BASE
