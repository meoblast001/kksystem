from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('',
	url(r'^accounts/login/$', 'karteikarten.login.Login', name = 'login'),
	url(r'^accounts/logout/$', 'karteikarten.login.Logout', name = 'logout'),
	url(r'^accounts/register/$', 'karteikarten.login.Register', name = 'register'),
	url(r'^accounts/recover_password/$', 'karteikarten.login.RecoverPassword', name = 'recover-password'),
	url(r'^accounts/recover_password/reset/$', 'karteikarten.login.RecoverResetPassword', name = 'recover-reset-password'),
	url(r'^$', 'karteikarten.centre.Centre', name = 'centre'),
	url(r'^run/$', 'karteikarten.centre.SelectSetToRun', name = 'select-set-to-run'),
	url(r'^run/select_box/(?P<set_id>\d+)/$', 'karteikarten.centre.SelectSetBoxToRun', name = 'select-set-box-to-run'),
	url(r'^run/start/(?P<set_id>\d+)/$', 'karteikarten.run.Start', name = 'run-start'),
	url(r'^run/review/$', 'karteikarten.run.Run', name = 'run-run'),
	url(r'^run/correct/(?P<card_id>\d+)/$', 'karteikarten.run.Correct', name = 'run-correct'),
	url(r'^run/incorrect/(?P<card_id>\d+)/$', 'karteikarten.run.Incorrect', name = 'run-incorrect'),
	url(r'^run/finished/$', 'karteikarten.run.Finished', name = 'run-finished'),
	url(r'^edit/$', 'karteikarten.centre.SelectSetToEdit', name = 'select-set-to-edit'),
	url(r'^edit/new/$', 'karteikarten.edit.NewSet', name = 'new-set'),
	url(r'^edit/(?P<set_id>\d+)/$', 'karteikarten.edit.EditSet', name = 'edit-set'),
	url(r'^edit/(?P<set_id>\d+)/boxes/$', 'karteikarten.edit.ViewBoxesBySet', name = 'edit-view-boxes-by-set'),
	url(r'^edit/(?P<set_id>\d+)/boxes/new/$', 'karteikarten.edit.NewBox', name = 'new-box'),
	url(r'^edit/(?P<set_id>\d+)/boxes/(?P<box_id>\d+)/$', 'karteikarten.edit.EditBox', name = 'edit-box'),
	url(r'^edit/(?P<set_id>\d+)/cards/$', 'karteikarten.edit.ViewCardsBySet', name = 'edit-view-cards-by-set'),
	url(r'^edit/(?P<set_id>\d+)/cards/search/$', 'karteikarten.edit.SearchCardsBySet', name = 'edit-search-cards-by-set'),
	url(r'^edit/(?P<set_id>\d+)/cards/new/$', 'karteikarten.edit.NewCard', name = 'new-card'),
	url(r'^edit/(?P<set_id>\d+)/cards/(?P<card_id>\d+)/$', 'karteikarten.edit.EditCard', name = 'edit-card'),
	url(r'^edit/(?P<set_id>\d+)/cards/(?P<card_id>\d+)/delete/$', 'karteikarten.edit.DeleteCard', name = 'delete-card'),
)
