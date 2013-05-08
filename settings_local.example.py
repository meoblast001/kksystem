# User-defined settings for karteikartensystem project.

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.', #Add 'postgresql_psycopg2',
                                         #'postgresql', 'mysql', 'sqlite3' or
                                         #'oracle'.
        'NAME': '', #Or path to database file if using sqlite3.
        'USER': '', #Not used with sqlite3.
        'PASSWORD': '', #Not used with sqlite3.
        'HOST': '', #Set to empty string for localhost. Not used with sqlite3.
        'PORT': '', #Set to empty string for default. Not used with sqlite3.
      }
  }

CACHES = {
    'default': {
        #'memcached.MemcachedCache' can be replaced with 'db.DatabaseCache',
        #'filebased.FileBasedCache', or 'locmem.LocMemCache'.
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        #With MemcachedCache, host and port, colon separated. With
        #DatabaseCache, table in database to store cache. With FileBasedCache,
        #directory to store cache files. With LocMemCache, unique snowflake.
        'LOCATION': '127.0.0.1:11211',
      }
  }

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'InsertSecretKeyHere'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Brussels'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en'

# Address from web server represeting root of application.
# Example: '/path/to/site/root'
FORCE_SCRIPT_NAME = '/'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = ''

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# Host and port of SMTP server to use to send emails.
EMAIL_HOST = ''
EMAIL_PORT = ''
