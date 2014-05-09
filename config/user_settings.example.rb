module UserSettings
  SECRET_KEY_BASE = 'INSERT_SOME_LONG_SECRET_TEXT_HERE'

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
