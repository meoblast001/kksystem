module UserSettings
  SECRET_KEY_BASE = 'INSERT_SOME_LONG_SECRET_TEXT_HERE'
  MAILER_SENDER = 'noreply@example.org'
  DEFAULT_URL = 'localhost:3000'

  module Application
    #General application settings.
  end

  module Development
    #Only for development.
  end

  module Test
    #Only for test.
  end

  module Production
    #Only for production.
  end
end
