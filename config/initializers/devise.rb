#Be sure to restart your server when you modify this file.

require File.expand_path('../../user_settings', __FILE__)

Devise.setup do |config|
  config.mailer_sender = UserSettings::MAILER_SENDER

  require 'devise/orm/active_record'

  config.case_insensitive_keys = [:username, :email]
  config.strip_whitespace_keys = [:username, :email]

  config.skip_session_storage = [:http_auth]

  config.stretches = Rails.env.test? ? 1 : 10

  config.reconfirmable = false

  config.password_length = 8..128
  config.reset_password_within = 6.hours

  config.sign_out_via = :delete
end
