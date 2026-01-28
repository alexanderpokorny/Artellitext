/**
 * Artellico - Internationalization (i18n) System
 * 
 * Lightweight, store-based i18n solution.
 * Translations are loaded on demand to minimize bundle size.
 */

import { browser } from '$app/environment';
import type { SupportedLanguage } from '$lib/types';

// ===========================================
// TRANSLATION TYPES
// ===========================================

export type TranslationKey = keyof typeof translations.de;
export type TranslationParams = Record<string, string | number>;

// ===========================================
// TRANSLATIONS
// ===========================================

export const translations = {
	de: {
		// General
		'app.name': 'Artellico',
		'app.tagline': 'Kognitive Denkplattform',
		
		// Navigation
		'nav.dashboard': 'Dashboard',
		'nav.knowledge': 'Wissen',
		'nav.literature': 'Literatur',
		'nav.recent': 'Zuletzt',
		'nav.tags': 'Tags',
		'nav.settings': 'Einstellungen',
		'nav.profile': 'Profil',
		'nav.admin': 'Administration',
		'nav.logout': 'Abmelden',
		
		// Auth
		'auth.login': 'Anmelden',
		'auth.register': 'Registrieren',
		'auth.email': 'E-Mail',
		'auth.username': 'Benutzername',
		'auth.password': 'Passwort',
		'auth.confirmPassword': 'Passwort bestätigen',
		'auth.forgotPassword': 'Passwort vergessen?',
		'auth.noAccount': 'Noch kein Konto?',
		'auth.hasAccount': 'Bereits ein Konto?',
		'auth.orContinueWith': 'oder',
		'auth.loginError': 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.',
		'auth.registerError': 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
		'auth.registerSuccess': 'Konto erfolgreich erstellt. Sie können sich jetzt anmelden.',
		'auth.subscriptionRequired': 'Ein aktives Abonnement ist erforderlich.',
		'auth.subscriptionExpired': 'Ihr Abonnement ist abgelaufen.',
		
		// Dashboard
		'dashboard.welcome': 'Willkommen zurück, {name}',
		'dashboard.statistics': 'Statistik',
		'dashboard.recentNotes': 'Letzte Notizen',
		'dashboard.recentDocs': 'Letzte Dokumente',
		'dashboard.quickActions': 'Schnellzugriff',
		'dashboard.newNote': 'Neue Notiz',
		'dashboard.uploadDoc': 'Dokument hochladen',
		'dashboard.stats.notes': 'Notizen',
		'dashboard.stats.documents': 'Dokumente',
		'dashboard.stats.storage': 'Speicher',
		
		// Editor
		'editor.untitled': 'Unbenannt',
		'editor.placeholder': 'Beginnen Sie zu schreiben oder drücken Sie / für Befehle...',
		'editor.saved': 'Gespeichert',
		'editor.saving': 'Wird gespeichert...',
		'editor.error': 'Fehler beim Speichern',
		'editor.wordCount': '{count} Wörter',
		'editor.readingTime': '{minutes} Min. Lesezeit',
		'editor.tags': 'Tags',
		'editor.addTag': 'Tag hinzufügen',
		'editor.references': 'Referenzen',
		'editor.marginalia': 'Marginalie',
		'editor.addMarginalia': 'Marginalie hinzufügen',
		'editor.newMarginalia': 'Neuer Marginaltext',
		'editor.fullscreen': 'Vollbild',
		'editor.exitFullscreen': 'Vollbild beenden',
		'editor.fullWidthToggle': 'Volle Breite',
		'editor.narrowWidth': 'Zentriert',
		
		// Literature
		'literature.title': 'Bibliothek',
		'literature.upload': 'Hochladen',
		'literature.filter': 'Filtern',
		'literature.sort': 'Sortieren',
		'literature.sortBy.date': 'Datum',
		'literature.sortBy.title': 'Titel',
		'literature.sortBy.type': 'Typ',
		'literature.view.grid': 'Raster',
		'literature.view.list': 'Liste',
		'literature.noDocuments': 'Noch keine Dokumente vorhanden',
		'literature.readingMode': 'Lesemodus',
		
		// Settings
		'settings.title': 'Einstellungen',
		'settings.profile': 'Profil',
		'settings.appearance': 'Darstellung',
		'settings.language': 'Sprache',
		'settings.theme': 'Thema',
		'settings.theme.light': 'Hell',
		'settings.theme.dark': 'Dunkel',
		'settings.theme.highContrast': 'Kontrast',
		'settings.theme.auto': 'System',
		'settings.cache': 'Offline-Cache',
		'settings.cacheLimit': 'Maximale Einträge im Cache',
		'settings.geolocation': 'Standorterfassung',
		'settings.apiKeys': 'API-Schlüssel',
		'settings.citations': 'Zitierformat',
		'settings.save': 'Speichern',
		'settings.saved': 'Einstellungen gespeichert',
		
		// Status
		'status.synced': 'Synchronisiert',
		'status.syncing': 'Wird synchronisiert...',
		'status.offline': 'Offline',
		'status.items': '{count} Einträge',
		'status.words': '{count} Wörter',
		'status.documents': '{count} Dokumente',
		
		// Actions
		'action.save': 'Speichern',
		'action.cancel': 'Abbrechen',
		'action.delete': 'Löschen',
		'action.edit': 'Bearbeiten',
		'action.duplicate': 'Duplizieren',
		'action.archive': 'Archivieren',
		'action.share': 'Teilen',
		'action.export': 'Exportieren',
		'action.search': 'Suchen',
		'action.close': 'Schließen',
		
		// Confirmations
		'confirm.delete': 'Möchten Sie diesen Eintrag wirklich löschen?',
		'confirm.unsaved': 'Es gibt ungespeicherte Änderungen. Möchten Sie wirklich fortfahren?',
		'confirm.logout': 'Möchten Sie sich wirklich abmelden?',
		
		// Errors
		'error.generic': 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
		'error.notFound': 'Seite nicht gefunden',
		'error.unauthorized': 'Nicht autorisiert',
		'error.networkError': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
		
		// Time
		'time.now': 'Jetzt',
		'time.minutesAgo': 'Vor {minutes} Minuten',
		'time.hoursAgo': 'Vor {hours} Stunden',
		'time.daysAgo': 'Vor {days} Tagen',
		'time.today': 'Heute',
		'time.yesterday': 'Gestern',
		
		// Sort
		'sort.updated': 'Aktualisiert',
		'sort.created': 'Erstellt',
		'sort.title': 'Titel',
		'sort.words': 'Wörter',
		
		// View modes
		'view.list': 'Listenansicht',
		'view.gridSmall': 'Kleine Karten',
		'view.gridLarge': 'Große Karten',
		'view.expanded': 'Erweitert',
		
		// Dashboard extras
		'dashboard.noNotes': 'Noch keine Notizen vorhanden',
		'dashboard.createFirst': 'Erste Notiz erstellen',
		
		// Editor extras
		'editor.words': 'Wörter',
		
		// Sidebar tabs
		'sidebar.marginalia': 'Marginalien',
		'sidebar.spellcheck': 'Rechtschreibung & Grammatik',
		'sidebar.stats': 'Textstatistik',
		'sidebar.tags': 'Tags',
		
		// Text Statistics
		'stats.counts': 'Zählungen',
		'stats.words': 'Wörter',
		'stats.characters': 'Zeichen',
		'stats.sentences': 'Sätze',
		'stats.paragraphs': 'Absätze',
		'stats.time': 'Zeitschätzung',
		'stats.readingTimeMin': 'Min. Lesezeit',
		'stats.speakingTimeMin': 'Min. Sprechzeit',
		'stats.readability': 'Lesbarkeit',
		'stats.readability.veryEasy': 'Sehr einfach',
		'stats.readability.easy': 'Einfach',
		'stats.readability.fairlyEasy': 'Relativ einfach',
		'stats.readability.standard': 'Standard',
		'stats.readability.fairlyDifficult': 'Relativ schwer',
		'stats.readability.difficult': 'Schwer',
		'stats.readability.veryDifficult': 'Sehr schwer',
		'stats.grade.elementary': 'Grundschule',
		'stats.grade.middleSchool': 'Mittelstufe',
		'stats.grade.highSchool': 'Oberstufe',
		'stats.grade.college': 'Universität',
		'stats.avgWordsPerSentence': 'Ø Wörter/Satz',
		'stats.quality': 'Schreibqualität',
		'stats.hardSentences': 'Schwere Sätze',
		'stats.veryHardSentences': 'Sehr schwere Sätze',
		'stats.adverbs': 'Adverbien',
		'stats.passiveVoice': 'Passiv',
	},
	
	en: {
		// General
		'app.name': 'Artellico',
		'app.tagline': 'Cognitive Thinking Platform',
		
		// Navigation
		'nav.dashboard': 'Dashboard',
		'nav.knowledge': 'Knowledge',
		'nav.literature': 'Literature',
		'nav.recent': 'Recent',
		'nav.tags': 'Tags',
		'nav.settings': 'Settings',
		'nav.profile': 'Profile',
		'nav.admin': 'Administration',
		'nav.logout': 'Logout',
		
		// Auth
		'auth.login': 'Login',
		'auth.register': 'Register',
		'auth.email': 'Email',
		'auth.username': 'Username',
		'auth.password': 'Password',
		'auth.confirmPassword': 'Confirm Password',
		'auth.forgotPassword': 'Forgot password?',
		'auth.noAccount': 'Don\'t have an account?',
		'auth.hasAccount': 'Already have an account?',
		'auth.orContinueWith': 'or',
		'auth.loginError': 'Login failed. Please check your credentials.',
		'auth.registerError': 'Registration failed. Please try again.',
		'auth.registerSuccess': 'Account created successfully. You can now log in.',
		'auth.subscriptionRequired': 'An active subscription is required.',
		'auth.subscriptionExpired': 'Your subscription has expired.',
		
		// Dashboard
		'dashboard.welcome': 'Welcome back, {name}',
		'dashboard.statistics': 'Statistics',
		'dashboard.recentNotes': 'Recent Notes',
		'dashboard.recentDocs': 'Recent Documents',
		'dashboard.quickActions': 'Quick Actions',
		'dashboard.newNote': 'New Note',
		'dashboard.uploadDoc': 'Upload Document',
		'dashboard.stats.notes': 'Notes',
		'dashboard.stats.documents': 'Documents',
		'dashboard.stats.storage': 'Storage',
		
		// Editor
		'editor.untitled': 'Untitled',
		'editor.placeholder': 'Start writing or press / for commands...',
		'editor.saved': 'Saved',
		'editor.saving': 'Saving...',
		'editor.error': 'Error saving',
		'editor.wordCount': '{count} words',
		'editor.readingTime': '{minutes} min read',
		'editor.tags': 'Tags',
		'editor.addTag': 'Add tag',
		'editor.references': 'References',
		'editor.marginalia': 'Marginalia',
		'editor.addMarginalia': 'Add marginalia',
		'editor.newMarginalia': 'New marginal note',
		'editor.fullscreen': 'Fullscreen',
		'editor.exitFullscreen': 'Exit fullscreen',
		'editor.fullWidthToggle': 'Full width',
		'editor.narrowWidth': 'Centered',
		
		// Literature
		'literature.title': 'Library',
		'literature.upload': 'Upload',
		'literature.filter': 'Filter',
		'literature.sort': 'Sort',
		'literature.sortBy.date': 'Date',
		'literature.sortBy.title': 'Title',
		'literature.sortBy.type': 'Type',
		'literature.view.grid': 'Grid',
		'literature.view.list': 'List',
		'literature.noDocuments': 'No documents yet',
		'literature.readingMode': 'Reading Mode',
		
		// Settings
		'settings.title': 'Settings',
		'settings.profile': 'Profile',
		'settings.appearance': 'Appearance',
		'settings.language': 'Language',
		'settings.theme': 'Theme',
		'settings.theme.light': 'Light',
		'settings.theme.dark': 'Dark',
		'settings.theme.highContrast': 'Contrast',
		'settings.theme.auto': 'System',
		'settings.cache': 'Offline Cache',
		'settings.cacheLimit': 'Maximum cached entries',
		'settings.geolocation': 'Location Tracking',
		'settings.apiKeys': 'API Keys',
		'settings.citations': 'Citation Format',
		'settings.save': 'Save',
		'settings.saved': 'Settings saved',
		
		// Status
		'status.synced': 'Synced',
		'status.syncing': 'Syncing...',
		'status.offline': 'Offline',
		'status.items': '{count} items',
		'status.words': '{count} words',
		'status.documents': '{count} documents',
		
		// Actions
		'action.save': 'Save',
		'action.cancel': 'Cancel',
		'action.delete': 'Delete',
		'action.edit': 'Edit',
		'action.duplicate': 'Duplicate',
		'action.archive': 'Archive',
		'action.share': 'Share',
		'action.export': 'Export',
		'action.search': 'Search',
		'action.close': 'Close',
		
		// Confirmations
		'confirm.delete': 'Are you sure you want to delete this item?',
		'confirm.unsaved': 'You have unsaved changes. Are you sure you want to continue?',
		'confirm.logout': 'Are you sure you want to log out?',
		
		// Errors
		'error.generic': 'An error occurred. Please try again.',
		'error.notFound': 'Page not found',
		'error.unauthorized': 'Unauthorized',
		'error.networkError': 'Network error. Please check your connection.',
		
		// Time
		'time.now': 'Now',
		'time.minutesAgo': '{minutes} minutes ago',
		'time.hoursAgo': '{hours} hours ago',
		'time.daysAgo': '{days} days ago',
		'time.today': 'Today',
		'time.yesterday': 'Yesterday',
		
		// Sort
		'sort.updated': 'Updated',
		'sort.created': 'Created',
		'sort.title': 'Title',
		'sort.words': 'Words',
		
		// View modes
		'view.list': 'List view',
		'view.gridSmall': 'Small cards',
		'view.gridLarge': 'Large cards',
		'view.expanded': 'Expanded',
		
		// Dashboard extras
		'dashboard.noNotes': 'No notes yet',
		'dashboard.createFirst': 'Create your first note',
		
		// Editor extras
		'editor.words': 'words',
		
		// Sidebar tabs
		'sidebar.marginalia': 'Marginalia',
		'sidebar.spellcheck': 'Spelling & Grammar',
		'sidebar.stats': 'Text Statistics',
		'sidebar.tags': 'Tags',
		
		// Text Statistics
		'stats.counts': 'Counts',
		'stats.words': 'Words',
		'stats.characters': 'Characters',
		'stats.sentences': 'Sentences',
		'stats.paragraphs': 'Paragraphs',
		'stats.time': 'Time Estimate',
		'stats.readingTimeMin': 'Min. reading',
		'stats.speakingTimeMin': 'Min. speaking',
		'stats.readability': 'Readability',
		'stats.readability.veryEasy': 'Very easy',
		'stats.readability.easy': 'Easy',
		'stats.readability.fairlyEasy': 'Fairly easy',
		'stats.readability.standard': 'Standard',
		'stats.readability.fairlyDifficult': 'Fairly difficult',
		'stats.readability.difficult': 'Difficult',
		'stats.readability.veryDifficult': 'Very difficult',
		'stats.grade.elementary': 'Elementary',
		'stats.grade.middleSchool': 'Middle school',
		'stats.grade.highSchool': 'High school',
		'stats.grade.college': 'College',
		'stats.avgWordsPerSentence': 'Avg words/sentence',
		'stats.quality': 'Writing Quality',
		'stats.hardSentences': 'Hard sentences',
		'stats.veryHardSentences': 'Very hard sentences',
		'stats.adverbs': 'Adverbs',
		'stats.passiveVoice': 'Passive voice',
	},
	
	fr: {
		// General
		'app.name': 'Artellico',
		'app.tagline': 'Plateforme de Pensée Cognitive',
		
		// Navigation
		'nav.dashboard': 'Tableau de bord',
		'nav.knowledge': 'Connaissances',
		'nav.literature': 'Littérature',
		'nav.recent': 'Récent',
		'nav.tags': 'Tags',
		'nav.settings': 'Paramètres',
		'nav.profile': 'Profil',
		'nav.admin': 'Administration',
		'nav.logout': 'Déconnexion',
		
		// Auth
		'auth.login': 'Connexion',
		'auth.register': 'S\'inscrire',
		'auth.email': 'E-mail',
		'auth.username': 'Nom d\'utilisateur',
		'auth.password': 'Mot de passe',
		'auth.confirmPassword': 'Confirmer le mot de passe',
		'auth.forgotPassword': 'Mot de passe oublié?',
		'auth.noAccount': 'Pas encore de compte?',
		'auth.hasAccount': 'Déjà un compte?',
		'auth.orContinueWith': 'ou',
		'auth.loginError': 'Échec de connexion. Veuillez vérifier vos identifiants.',
		'auth.registerError': 'Échec de l\'inscription. Veuillez réessayer.',
		'auth.registerSuccess': 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
		'auth.subscriptionRequired': 'Un abonnement actif est requis.',
		'auth.subscriptionExpired': 'Votre abonnement a expiré.',
		
		// Simplified - would have full translations in production
		'dashboard.welcome': 'Bienvenue, {name}',
		'dashboard.statistics': 'Statistiques',
		'dashboard.recentNotes': 'Notes récentes',
		'dashboard.recentDocs': 'Documents récents',
		'dashboard.quickActions': 'Actions rapides',
		'dashboard.newNote': 'Nouvelle note',
		'dashboard.uploadDoc': 'Télécharger un document',
		'dashboard.stats.notes': 'Notes',
		'dashboard.stats.documents': 'Documents',
		'dashboard.stats.storage': 'Stockage',
		
		// Editor
		'editor.untitled': 'Sans titre',
		'editor.placeholder': 'Commencez à écrire ou appuyez sur / pour les commandes...',
		'editor.saved': 'Enregistré',
		'editor.saving': 'Enregistrement...',
		'editor.error': 'Erreur d\'enregistrement',
		'editor.wordCount': '{count} mots',
		'editor.readingTime': '{minutes} min de lecture',
		'editor.tags': 'Tags',
		'editor.addTag': 'Ajouter un tag',
		'editor.references': 'Références',
		'editor.marginalia': 'Marginalia',
		'editor.addMarginalia': 'Ajouter marginalia',
		'editor.newMarginalia': 'Nouvelle note marginale',
		'editor.fullscreen': 'Plein écran',
		'editor.exitFullscreen': 'Quitter le plein écran',
		'editor.fullWidthToggle': 'Pleine largeur',
		'editor.narrowWidth': 'Centré',
		
		// Literature
		'literature.title': 'Bibliothèque',
		'literature.upload': 'Télécharger',
		'literature.filter': 'Filtrer',
		'literature.sort': 'Trier',
		'literature.sortBy.date': 'Date',
		'literature.sortBy.title': 'Titre',
		'literature.sortBy.type': 'Type',
		'literature.view.grid': 'Grille',
		'literature.view.list': 'Liste',
		'literature.noDocuments': 'Aucun document',
		'literature.readingMode': 'Mode lecture',
		
		// Settings
		'settings.title': 'Paramètres',
		'settings.profile': 'Profil',
		'settings.appearance': 'Apparence',
		'settings.language': 'Langue',
		'settings.theme': 'Thème',
		'settings.theme.light': 'Clair',
		'settings.theme.dark': 'Sombre',
		'settings.theme.highContrast': 'Contraste',
		'settings.theme.auto': 'Système',
		'settings.cache': 'Cache hors ligne',
		'settings.cacheLimit': 'Entrées maximales en cache',
		'settings.geolocation': 'Suivi de localisation',
		'settings.apiKeys': 'Clés API',
		'settings.citations': 'Format de citation',
		'settings.save': 'Enregistrer',
		'settings.saved': 'Paramètres enregistrés',
		
		// Status
		'status.synced': 'Synchronisé',
		'status.syncing': 'Synchronisation...',
		'status.offline': 'Hors ligne',
		'status.items': '{count} éléments',
		'status.words': '{count} mots',
		'status.documents': '{count} documents',
		
		// Actions
		'action.save': 'Enregistrer',
		'action.cancel': 'Annuler',
		'action.delete': 'Supprimer',
		'action.edit': 'Modifier',
		'action.duplicate': 'Dupliquer',
		'action.archive': 'Archiver',
		'action.share': 'Partager',
		'action.export': 'Exporter',
		'action.search': 'Rechercher',
		'action.close': 'Fermer',
		
		// Confirmations
		'confirm.delete': 'Voulez-vous vraiment supprimer cet élément?',
		'confirm.unsaved': 'Vous avez des modifications non enregistrées. Voulez-vous continuer?',
		'confirm.logout': 'Voulez-vous vraiment vous déconnecter?',
		
		// Errors
		'error.generic': 'Une erreur s\'est produite. Veuillez réessayer.',
		'error.notFound': 'Page non trouvée',
		'error.unauthorized': 'Non autorisé',
		'error.networkError': 'Erreur réseau. Veuillez vérifier votre connexion.',
		
		// Time
		'time.now': 'Maintenant',
		'time.minutesAgo': 'Il y a {minutes} minutes',
		'time.hoursAgo': 'Il y a {hours} heures',
		'time.daysAgo': 'Il y a {days} jours',
		'time.today': 'Aujourd\'hui',
		'time.yesterday': 'Hier',
		
		// Sort
		'sort.updated': 'Mis à jour',
		'sort.created': 'Créé',
		'sort.title': 'Titre',
		'sort.words': 'Mots',
		
		// View modes
		'view.list': 'Liste',
		'view.gridSmall': 'Petites cartes',
		'view.gridLarge': 'Grandes cartes',
		'view.expanded': 'Étendu',
		
		// Dashboard extras
		'dashboard.noNotes': 'Pas encore de notes',
		'dashboard.createFirst': 'Créer votre première note',
		
		// Editor extras
		'editor.words': 'mots',
		
		// Sidebar tabs
		'sidebar.marginalia': 'Marginalia',
		'sidebar.spellcheck': 'Orthographe & Grammaire',
		'sidebar.stats': 'Statistiques',
		'sidebar.tags': 'Tags',
		
		// Text Statistics
		'stats.counts': 'Comptages',
		'stats.words': 'Mots',
		'stats.characters': 'Caractères',
		'stats.sentences': 'Phrases',
		'stats.paragraphs': 'Paragraphes',
		'stats.time': 'Estimation du temps',
		'stats.readingTimeMin': 'Min. de lecture',
		'stats.speakingTimeMin': 'Min. de parole',
		'stats.readability': 'Lisibilité',
		'stats.readability.veryEasy': 'Très facile',
		'stats.readability.easy': 'Facile',
		'stats.readability.fairlyEasy': 'Assez facile',
		'stats.readability.standard': 'Standard',
		'stats.readability.fairlyDifficult': 'Assez difficile',
		'stats.readability.difficult': 'Difficile',
		'stats.readability.veryDifficult': 'Très difficile',
		'stats.grade.elementary': 'Primaire',
		'stats.grade.middleSchool': 'Collège',
		'stats.grade.highSchool': 'Lycée',
		'stats.grade.college': 'Université',
		'stats.avgWordsPerSentence': 'Moy. mots/phrase',
		'stats.quality': 'Qualité d\'écriture',
		'stats.hardSentences': 'Phrases difficiles',
		'stats.veryHardSentences': 'Phrases très difficiles',
		'stats.adverbs': 'Adverbes',
		'stats.passiveVoice': 'Voix passive',
	},
	
	es: {
		// General
		'app.name': 'Artellico',
		'app.tagline': 'Plataforma de Pensamiento Cognitivo',
		
		// Navigation
		'nav.dashboard': 'Panel',
		'nav.knowledge': 'Conocimiento',
		'nav.literature': 'Literatura',
		'nav.recent': 'Reciente',
		'nav.tags': 'Etiquetas',
		'nav.settings': 'Configuración',
		'nav.profile': 'Perfil',
		'nav.admin': 'Administración',
		'nav.logout': 'Cerrar sesión',
		
		// Auth
		'auth.login': 'Iniciar sesión',
		'auth.register': 'Registrarse',
		'auth.email': 'Correo electrónico',
		'auth.username': 'Nombre de usuario',
		'auth.password': 'Contraseña',
		'auth.confirmPassword': 'Confirmar contraseña',
		'auth.forgotPassword': '¿Olvidaste tu contraseña?',
		'auth.noAccount': '¿No tienes cuenta?',
		'auth.hasAccount': '¿Ya tienes cuenta?',
		'auth.orContinueWith': 'o',
		'auth.loginError': 'Error al iniciar sesión. Por favor verifica tus datos.',
		'auth.registerError': 'Error al registrarse. Por favor intenta de nuevo.',
		'auth.registerSuccess': 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
		'auth.subscriptionRequired': 'Se requiere una suscripción activa.',
		'auth.subscriptionExpired': 'Tu suscripción ha expirado.',
		
		// Simplified - would have full translations in production
		'dashboard.welcome': 'Bienvenido, {name}',
		'dashboard.statistics': 'Estadísticas',
		'dashboard.recentNotes': 'Notas recientes',
		'dashboard.recentDocs': 'Documentos recientes',
		'dashboard.quickActions': 'Acciones rápidas',
		'dashboard.newNote': 'Nueva nota',
		'dashboard.uploadDoc': 'Subir documento',
		'dashboard.stats.notes': 'Notas',
		'dashboard.stats.documents': 'Documentos',
		'dashboard.stats.storage': 'Almacenamiento',
		
		// Editor
		'editor.untitled': 'Sin título',
		'editor.placeholder': 'Empieza a escribir o presiona / para comandos...',
		'editor.saved': 'Guardado',
		'editor.saving': 'Guardando...',
		'editor.error': 'Error al guardar',
		'editor.wordCount': '{count} palabras',
		'editor.readingTime': '{minutes} min de lectura',
		'editor.tags': 'Etiquetas',
		'editor.addTag': 'Añadir etiqueta',
		'editor.references': 'Referencias',
		'editor.marginalia': 'Marginalia',
		'editor.addMarginalia': 'Añadir marginalia',
		'editor.newMarginalia': 'Nueva nota marginal',
		'editor.fullscreen': 'Pantalla completa',
		'editor.exitFullscreen': 'Salir de pantalla completa',
		'editor.fullWidthToggle': 'Ancho completo',
		'editor.narrowWidth': 'Centrado',
		
		// Literature
		'literature.title': 'Biblioteca',
		'literature.upload': 'Subir',
		'literature.filter': 'Filtrar',
		'literature.sort': 'Ordenar',
		'literature.sortBy.date': 'Fecha',
		'literature.sortBy.title': 'Título',
		'literature.sortBy.type': 'Tipo',
		'literature.view.grid': 'Cuadrícula',
		'literature.view.list': 'Lista',
		'literature.noDocuments': 'Sin documentos',
		'literature.readingMode': 'Modo lectura',
		
		// Settings
		'settings.title': 'Configuración',
		'settings.profile': 'Perfil',
		'settings.appearance': 'Apariencia',
		'settings.language': 'Idioma',
		'settings.theme': 'Tema',
		'settings.theme.light': 'Claro',
		'settings.theme.dark': 'Oscuro',
		'settings.theme.highContrast': 'Contraste',
		'settings.theme.auto': 'Sistema',
		'settings.cache': 'Caché offline',
		'settings.cacheLimit': 'Máximo de entradas en caché',
		'settings.geolocation': 'Seguimiento de ubicación',
		'settings.apiKeys': 'Claves API',
		'settings.citations': 'Formato de cita',
		'settings.save': 'Guardar',
		'settings.saved': 'Configuración guardada',
		
		// Status
		'status.synced': 'Sincronizado',
		'status.syncing': 'Sincronizando...',
		'status.offline': 'Sin conexión',
		'status.items': '{count} elementos',
		'status.words': '{count} palabras',
		'status.documents': '{count} documentos',
		
		// Actions
		'action.save': 'Guardar',
		'action.cancel': 'Cancelar',
		'action.delete': 'Eliminar',
		'action.edit': 'Editar',
		'action.duplicate': 'Duplicar',
		'action.archive': 'Archivar',
		'action.share': 'Compartir',
		'action.export': 'Exportar',
		'action.search': 'Buscar',
		'action.close': 'Cerrar',
		
		// Confirmations
		'confirm.delete': '¿Estás seguro de que quieres eliminar este elemento?',
		'confirm.unsaved': 'Tienes cambios sin guardar. ¿Estás seguro de que quieres continuar?',
		'confirm.logout': '¿Estás seguro de que quieres cerrar sesión?',
		
		// Errors
		'error.generic': 'Ha ocurrido un error. Por favor intenta de nuevo.',
		'error.notFound': 'Página no encontrada',
		'error.unauthorized': 'No autorizado',
		'error.networkError': 'Error de red. Por favor verifica tu conexión.',
		
		// Time
		'time.now': 'Ahora',
		'time.minutesAgo': 'Hace {minutes} minutos',
		'time.hoursAgo': 'Hace {hours} horas',
		'time.daysAgo': 'Hace {days} días',
		'time.today': 'Hoy',
		'time.yesterday': 'Ayer',
		
		// Sort
		'sort.updated': 'Actualizado',
		'sort.created': 'Creado',
		'sort.title': 'Título',
		'sort.words': 'Palabras',
		
		// View modes
		'view.list': 'Lista',
		'view.gridSmall': 'Tarjetas pequeñas',
		'view.gridLarge': 'Tarjetas grandes',
		'view.expanded': 'Expandido',
		
		// Dashboard extras
		'dashboard.noNotes': 'Aún no hay notas',
		'dashboard.createFirst': 'Crea tu primera nota',
		
		// Editor extras
		'editor.words': 'palabras',
		
		// Sidebar tabs
		'sidebar.marginalia': 'Marginalia',
		'sidebar.spellcheck': 'Ortografía y Gramática',
		'sidebar.stats': 'Estadísticas',
		'sidebar.tags': 'Etiquetas',
		
		// Text Statistics
		'stats.counts': 'Recuentos',
		'stats.words': 'Palabras',
		'stats.characters': 'Caracteres',
		'stats.sentences': 'Oraciones',
		'stats.paragraphs': 'Párrafos',
		'stats.time': 'Tiempo estimado',
		'stats.readingTimeMin': 'Min. lectura',
		'stats.speakingTimeMin': 'Min. habla',
		'stats.readability': 'Legibilidad',
		'stats.readability.veryEasy': 'Muy fácil',
		'stats.readability.easy': 'Fácil',
		'stats.readability.fairlyEasy': 'Bastante fácil',
		'stats.readability.standard': 'Estándar',
		'stats.readability.fairlyDifficult': 'Bastante difícil',
		'stats.readability.difficult': 'Difícil',
		'stats.readability.veryDifficult': 'Muy difícil',
		'stats.grade.elementary': 'Primaria',
		'stats.grade.middleSchool': 'Secundaria',
		'stats.grade.highSchool': 'Bachillerato',
		'stats.grade.college': 'Universidad',
		'stats.avgWordsPerSentence': 'Prom. palabras/oración',
		'stats.quality': 'Calidad de escritura',
		'stats.hardSentences': 'Oraciones difíciles',
		'stats.veryHardSentences': 'Oraciones muy difíciles',
		'stats.adverbs': 'Adverbios',
		'stats.passiveVoice': 'Voz pasiva',
	},
	
	it: {
		// General
		'app.name': 'Artellico',
		'app.tagline': 'Piattaforma di Pensiero Cognitivo',
		
		// Navigation
		'nav.dashboard': 'Dashboard',
		'nav.knowledge': 'Conoscenza',
		'nav.literature': 'Letteratura',
		'nav.recent': 'Recente',
		'nav.tags': 'Tag',
		'nav.settings': 'Impostazioni',
		'nav.profile': 'Profilo',
		'nav.admin': 'Amministrazione',
		'nav.logout': 'Esci',
		
		// Auth
		'auth.login': 'Accedi',
		'auth.register': 'Registrati',
		'auth.email': 'Email',
		'auth.username': 'Nome utente',
		'auth.password': 'Password',
		'auth.confirmPassword': 'Conferma password',
		'auth.forgotPassword': 'Password dimenticata?',
		'auth.noAccount': 'Non hai un account?',
		'auth.hasAccount': 'Hai già un account?',
		'auth.orContinueWith': 'oppure',
		'auth.loginError': 'Accesso fallito. Controlla le tue credenziali.',
		'auth.registerError': 'Registrazione fallita. Riprova.',
		'auth.registerSuccess': 'Account creato con successo. Ora puoi accedere.',
		'auth.subscriptionRequired': 'È richiesto un abbonamento attivo.',
		'auth.subscriptionExpired': 'Il tuo abbonamento è scaduto.',
		
		// Simplified for initial implementation
		'dashboard.welcome': 'Bentornato, {name}',
		'dashboard.statistics': 'Statistiche',
		'dashboard.recentNotes': 'Note recenti',
		'dashboard.recentDocs': 'Documenti recenti',
		'dashboard.quickActions': 'Azioni rapide',
		'dashboard.newNote': 'Nuova nota',
		'dashboard.uploadDoc': 'Carica documento',
		'dashboard.stats.notes': 'Note',
		'dashboard.stats.documents': 'Documenti',
		'dashboard.stats.storage': 'Spazio',
		
		// Editor
		'editor.untitled': 'Senza titolo',
		'editor.placeholder': 'Inizia a scrivere o premi / per i comandi...',
		'editor.saved': 'Salvato',
		'editor.saving': 'Salvataggio...',
		'editor.error': 'Errore di salvataggio',
		'editor.wordCount': '{count} parole',
		'editor.readingTime': '{minutes} min di lettura',
		'editor.tags': 'Tag',
		'editor.addTag': 'Aggiungi tag',
		'editor.references': 'Riferimenti',
		'editor.marginalia': 'Marginalia',
		'editor.addMarginalia': 'Aggiungi marginalia',
		'editor.newMarginalia': 'Nuova nota marginale',
		'editor.fullscreen': 'Schermo intero',
		'editor.exitFullscreen': 'Esci da schermo intero',
		'editor.fullWidthToggle': 'Larghezza completa',
		'editor.narrowWidth': 'Centrato',
		
		// Literature
		'literature.title': 'Biblioteca',
		'literature.upload': 'Carica',
		'literature.filter': 'Filtra',
		'literature.sort': 'Ordina',
		'literature.sortBy.date': 'Data',
		'literature.sortBy.title': 'Titolo',
		'literature.sortBy.type': 'Tipo',
		'literature.view.grid': 'Griglia',
		'literature.view.list': 'Lista',
		'literature.noDocuments': 'Nessun documento',
		'literature.readingMode': 'Modalità lettura',
		
		// Settings
		'settings.title': 'Impostazioni',
		'settings.profile': 'Profilo',
		'settings.appearance': 'Aspetto',
		'settings.language': 'Lingua',
		'settings.theme': 'Tema',
		'settings.theme.light': 'Chiaro',
		'settings.theme.dark': 'Scuro',
		'settings.theme.highContrast': 'Contrasto',
		'settings.theme.auto': 'Sistema',
		'settings.cache': 'Cache offline',
		'settings.cacheLimit': 'Voci massime in cache',
		'settings.geolocation': 'Tracciamento posizione',
		'settings.apiKeys': 'Chiavi API',
		'settings.citations': 'Formato citazione',
		'settings.save': 'Salva',
		'settings.saved': 'Impostazioni salvate',
		
		// Status
		'status.synced': 'Sincronizzato',
		'status.syncing': 'Sincronizzazione...',
		'status.offline': 'Offline',
		'status.items': '{count} elementi',
		'status.words': '{count} parole',
		'status.documents': '{count} documenti',
		
		// Actions
		'action.save': 'Salva',
		'action.cancel': 'Annulla',
		'action.delete': 'Elimina',
		'action.edit': 'Modifica',
		'action.duplicate': 'Duplica',
		'action.archive': 'Archivia',
		'action.share': 'Condividi',
		'action.export': 'Esporta',
		'action.search': 'Cerca',
		'action.close': 'Chiudi',
		
		// Confirmations
		'confirm.delete': 'Sei sicuro di voler eliminare questo elemento?',
		'confirm.unsaved': 'Hai modifiche non salvate. Sei sicuro di voler continuare?',
		'confirm.logout': 'Sei sicuro di voler uscire?',
		
		// Errors
		'error.generic': 'Si è verificato un errore. Riprova.',
		'error.notFound': 'Pagina non trovata',
		'error.unauthorized': 'Non autorizzato',
		'error.networkError': 'Errore di rete. Controlla la tua connessione.',
		
		// Time
		'time.now': 'Adesso',
		'time.minutesAgo': '{minutes} minuti fa',
		'time.hoursAgo': '{hours} ore fa',
		'time.daysAgo': '{days} giorni fa',
		'time.today': 'Oggi',
		'time.yesterday': 'Ieri',
		
		// Sort
		'sort.updated': 'Aggiornato',
		'sort.created': 'Creato',
		'sort.title': 'Titolo',
		'sort.words': 'Parole',
		
		// View modes
		'view.list': 'Lista',
		'view.gridSmall': 'Piccole schede',
		'view.gridLarge': 'Grandi schede',
		'view.expanded': 'Espanso',
		
		// Dashboard extras
		'dashboard.noNotes': 'Nessuna nota ancora',
		'dashboard.createFirst': 'Crea la tua prima nota',
		
		// Editor extras
		'editor.words': 'parole',
		
		// Sidebar tabs
		'sidebar.marginalia': 'Marginalia',
		'sidebar.spellcheck': 'Ortografia e Grammatica',
		'sidebar.stats': 'Statistiche',
		'sidebar.tags': 'Tag',
		
		// Text Statistics
		'stats.counts': 'Conteggi',
		'stats.words': 'Parole',
		'stats.characters': 'Caratteri',
		'stats.sentences': 'Frasi',
		'stats.paragraphs': 'Paragrafi',
		'stats.time': 'Stima del tempo',
		'stats.readingTimeMin': 'Min. lettura',
		'stats.speakingTimeMin': 'Min. parlato',
		'stats.readability': 'Leggibilità',
		'stats.readability.veryEasy': 'Molto facile',
		'stats.readability.easy': 'Facile',
		'stats.readability.fairlyEasy': 'Abbastanza facile',
		'stats.readability.standard': 'Standard',
		'stats.readability.fairlyDifficult': 'Abbastanza difficile',
		'stats.readability.difficult': 'Difficile',
		'stats.readability.veryDifficult': 'Molto difficile',
		'stats.grade.elementary': 'Elementare',
		'stats.grade.middleSchool': 'Media',
		'stats.grade.highSchool': 'Superiore',
		'stats.grade.college': 'Università',
		'stats.avgWordsPerSentence': 'Media parole/frase',
		'stats.quality': 'Qualità scrittura',
		'stats.hardSentences': 'Frasi difficili',
		'stats.veryHardSentences': 'Frasi molto difficili',
		'stats.adverbs': 'Avverbi',
		'stats.passiveVoice': 'Voce passiva',
	},
} as const;

// ===========================================
// LANGUAGE DETECTION
// ===========================================

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['de', 'en', 'fr', 'es', 'it'];
const DEFAULT_LANGUAGE: SupportedLanguage = 'de';
const STORAGE_KEY = 'artellico_language';

/**
 * Detect the user's preferred language from browser settings.
 */
export function detectBrowserLanguage(): SupportedLanguage {
	if (!browser) return DEFAULT_LANGUAGE;
	
	const browserLang = navigator.language?.split('-')[0] as SupportedLanguage;
	
	if (SUPPORTED_LANGUAGES.includes(browserLang)) {
		return browserLang;
	}
	
	// Check navigator.languages for fallbacks
	for (const lang of navigator.languages || []) {
		const short = lang.split('-')[0] as SupportedLanguage;
		if (SUPPORTED_LANGUAGES.includes(short)) {
			return short;
		}
	}
	
	return DEFAULT_LANGUAGE;
}

/**
 * Get the stored language preference.
 */
export function getStoredLanguage(): SupportedLanguage | null {
	if (!browser) return null;
	
	const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
	return SUPPORTED_LANGUAGES.includes(stored) ? stored : null;
}

/**
 * Store the language preference.
 */
export function setStoredLanguage(lang: SupportedLanguage): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, lang);
}

// ===========================================
// SVELTE 5 RUNES-BASED I18N STATE
// ===========================================

// Global singleton state for language
let globalLanguage = $state<SupportedLanguage>(DEFAULT_LANGUAGE);
let initialized = false;

/**
 * Initialize the global language state (called once on app start)
 */
function initializeLanguage(): void {
	if (initialized) return;
	initialized = true;
	
	const stored = getStoredLanguage();
	const detected = detectBrowserLanguage();
	globalLanguage = stored || detected;
	
	// Update HTML lang attribute
	if (browser) {
		document.documentElement.lang = globalLanguage;
	}
}

/**
 * Create i18n accessor with Svelte 5 runes.
 * All instances share the same global language state.
 */
export function createI18n() {
	// Initialize on first access
	if (browser && !initialized) {
		initializeLanguage();
	}
	
	// Translate function
	function t(key: TranslationKey, params?: TranslationParams): string {
		const langTranslations = translations[globalLanguage as keyof typeof translations];
		const translation: string = langTranslations?.[key as keyof typeof langTranslations] || translations.de[key] || key;
		
		if (!params) return translation;
		
		// Replace {param} placeholders
		let result: string = translation;
		for (const [paramKey, value] of Object.entries(params)) {
			result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
		}
		return result;
	}
	
	// Set language and persist
	function setLanguage(lang: SupportedLanguage): void {
		globalLanguage = lang;
		setStoredLanguage(lang);
		
		// Update HTML lang attribute
		if (browser) {
			document.documentElement.lang = lang;
		}
	}
	
	return {
		get language() { return globalLanguage; },
		set language(lang: SupportedLanguage) { setLanguage(lang); },
		t,
		setLanguage,
		supportedLanguages: SUPPORTED_LANGUAGES,
	};
}

// ===========================================
// LANGUAGE NAMES FOR UI
// ===========================================

export const languageNames: Record<SupportedLanguage, string> = {
	de: 'Deutsch',
	en: 'English',
	fr: 'Français',
	es: 'Español',
	it: 'Italiano',
};
