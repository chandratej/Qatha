/** Telugu-first Creator Studio strings — modern conversational tone */

export type StudioLocale = 'te' | 'en';

export const STORAGE_KEY = 'katha_studio_locale';

export function loadLocale(): StudioLocale {
  if (typeof window === 'undefined') return 'te';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'te';
}

export function saveLocale(locale: StudioLocale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}

export type StudioStringKey =
  | 'nav.dashboard'
  | 'nav.stories'
  | 'nav.events'
  | 'nav.publishing'
  | 'nav.schedule'
  | 'nav.community'
  | 'nav.reviewers'
  | 'nav.monetization'
  | 'nav.moderation'
  | 'nav.search'
  | 'nav.profile'
  | 'nav.settings'
  | 'nav.signOut'
  | 'nav.languageToggle'
  | 'nav.languageToggleAria'
  | 'common.save'
  | 'common.cancel'
  | 'common.share'
  | 'common.delete'
  | 'common.edit'
  | 'common.create'
  | 'common.submit'
  | 'common.back'
  | 'common.next'
  | 'common.close'
  | 'common.loading'
  | 'common.error'
  | 'common.retry'
  | 'common.comingSoon'
  | 'common.search'
  | 'common.filter'
  | 'common.upload'
  | 'common.download'
  | 'common.copy'
  | 'common.copied'
  | 'common.required'
  | 'common.optional'
  | 'common.yes'
  | 'common.no'
  | 'common.confirm'
  | 'common.viewAll'
  | 'common.learnMore'
  | 'createStory.title'
  | 'createStory.subtitle'
  | 'createStory.eyebrow'
  | 'createStory.storyTitle'
  | 'createStory.storyTitlePlaceholder'
  | 'createStory.contentType'
  | 'createStory.primaryGenre'
  | 'createStory.secondaryGenres'
  | 'createStory.ageRating'
  | 'createStory.language'
  | 'createStory.completionStatus'
  | 'createStory.setting'
  | 'createStory.settingPlaceholder'
  | 'createStory.themes'
  | 'createStory.themesPlaceholder'
  | 'createStory.communityTags'
  | 'createStory.tagSearchPlaceholder'
  | 'createStory.description'
  | 'createStory.descriptionPlaceholder'
  | 'createStory.releaseSchedule'
  | 'createStory.coverImage'
  | 'createStory.coverHint'
  | 'createStory.coverPlaceholder'
  | 'createStory.coverUpload'
  | 'createStory.submit'
  | 'createStory.submitting'
  | 'createStory.coverRequired'
  | 'createStory.moodTagsHint'
  | 'createStory.requestTag'
  | 'createStory.wizardSteps'
  | 'createStory.stepIdentity'
  | 'createStory.stepFormat'
  | 'createStory.stepPublish'
  | 'createStory.essentials'
  | 'createStory.advancedDetails'
  | 'createStory.sidecardTitle'
  | 'createStory.sidecardText'
  | 'createStory.submitHint'
  | 'stories.prideTitle'
  | 'stories.prideText'
  | 'notifications.eyebrow'
  | 'notifications.title'
  | 'notifications.subtitle'
  | 'notifications.marking'
  | 'notifications.markAll'
  | 'notifications.filterAll'
  | 'notifications.filterReview'
  | 'notifications.filterPublish'
  | 'notifications.filterModeration'
  | 'notifications.emptyTitle'
  | 'notifications.emptyText'
  | 'notifications.open'
  | 'moderation.eyebrow'
  | 'moderation.title'
  | 'moderation.subtitle'
  | 'moderation.filterLabel'
  | 'moderation.filterPending'
  | 'moderation.filterAll'
  | 'moderation.refresh'
  | 'moderation.loading'
  | 'moderation.emptyTitle'
  | 'moderation.emptyText'
  | 'moderation.pending'
  | 'moderation.toxicity'
  | 'moderation.chapter'
  | 'moderation.untitled'
  | 'moderation.notesLabel'
  | 'moderation.notesPlaceholder'
  | 'moderation.approve'
  | 'moderation.requestEdits'
  | 'moderation.reject'
  | 'moderation.prevPage'
  | 'moderation.nextPage'
  | 'moderation.page'
  | 'stories.title'
  | 'stories.subtitle'
  | 'stories.eyebrow'
  | 'stories.newStory'
  | 'stories.empty'
  | 'stories.draft'
  | 'stories.ongoing'
  | 'stories.completed'
  | 'stories.chapters'
  | 'stories.readers'
  | 'stories.lastUpdated'
  | 'stories.manage'
  | 'stories.write'
  | 'stories.searchPlaceholder'
  | 'stories.filterStatus'
  | 'stories.allStatuses'
  | 'stories.statusPublished'
  | 'stories.statusPendingReview'
  | 'stories.statusNeedsRevision'
  | 'stories.noMatchTitle'
  | 'stories.noMatchText'
  | 'stories.clearFilters'
  | 'stories.loading'
  | 'stories.emptyShelfTitle'
  | 'stories.emptyShelfTe'
  | 'stories.emptyShelfText'
  | 'stories.createFirst'
  | 'stories.openManuscript'
  | 'stories.continueWriting'
  | 'stories.analytics'
  | 'stories.archiveConfirm'
  | 'shareModal.title'
  | 'shareModal.selectChapter'
  | 'shareModal.copyLink'
  | 'shareModal.freeHint'
  | 'shareModal.linkLabel'
  | 'events.title'
  | 'events.subtitle'
  | 'events.eyebrow'
  | 'events.hostEvent'
  | 'events.openEvents'
  | 'events.myEvents'
  | 'events.register'
  | 'events.registered'
  | 'events.submit'
  | 'events.prizePool'
  | 'events.freeEntry'
  | 'events.paidEntry'
  | 'events.deadline'
  | 'events.join'
  | 'events.viewEvent'
  | 'events.viewRegistration'
  | 'events.upcomingClosed'
  | 'events.emptyTitle'
  | 'events.emptyText'
  | 'events.debutHeroTitle'
  | 'events.debutHeroSubtitle'
  | 'events.debutJourney'
  | 'events.debutEvaluation'
  | 'events.debutProgress'
  | 'events.debutChapters'
  | 'events.hostPrivilege'
  | 'events.registeredCount'
  | 'events.recognitionPrizes'
  | 'events.resultsDate'
  | 'events.selectStory'
  | 'events.eligibilityBlocked'
  | 'events.createTitle'
  | 'events.createSubtitle'
  | 'events.publishOpen'
  | 'events.wizardEyebrow'
  | 'events.wizardStepsLabel'
  | 'events.wizardStepBasic'
  | 'events.wizardStepEligibility'
  | 'events.wizardStepRegistration'
  | 'events.wizardStepPrizes'
  | 'events.wizardStepJudging'
  | 'events.wizardStepTimeline'
  | 'events.wizardStepPublishing'
  | 'events.eventTitle'
  | 'events.description'
  | 'events.eventType'
  | 'events.titlePlaceholder'
  | 'events.descriptionPlaceholder'
  | 'events.eligibilityDesc'
  | 'events.registrationDesc'
  | 'events.timelineDesc'
  | 'events.publishingDesc'
  | 'events.judgingModel'
  | 'events.openingRegistration'
  | 'events.titleRequired'
  | 'events.hostBlockedTitle'
  | 'events.eventDetails'
  | 'events.type'
  | 'events.status'
  | 'events.judging'
  | 'events.entry'
  | 'events.submissions'
  | 'events.evaluationRubric'
  | 'events.registrationCloses'
  | 'events.submissionsClose'
  | 'events.debutSeasonEyebrow'
  | 'events.creativeContest'
  | 'events.freeRegistrationHint'
  | 'events.submittedStory'
  | 'events.registrationClosed'
  | 'events.registrationComplete'
  | 'events.alreadyRegistered'
  | 'events.registering'
  | 'events.submitting'
  | 'events.noStories'
  | 'events.createManuscript'
  | 'events.chooseStoryError'
  | 'events.submittedFor'
  | 'events.debutSeasonBadge'
  | 'events.dimension'
  | 'events.weight'
  | 'events.debutArcChapters'
  | 'events.debutSeasonFree'
  | 'events.journeyRegister'
  | 'events.journeyWrite'
  | 'events.journeySubmit'
  | 'events.journeyEvaluate'
  | 'events.journeyRecognition'
  | 'events.rulesTitle'
  | 'events.rulesEligibility'
  | 'events.rulesJudging'
  | 'events.rulesPrizes'
  | 'events.rulesTimeline'
  | 'events.rulesAccept'
  | 'events.rulesMustAccept'
  | 'events.rulesVersion'
  | 'events.rulesRecognitionOnly'
  | 'events.rulesNoCash'
  | 'events.statusRegistrationOpen'
  | 'events.statusSubmissionsOpen'
  | 'events.statusPublished'
  | 'events.statusJudging'
  | 'events.statusCompleted'
  | 'events.statusDraft'
  | 'events.statusCancelled'
  | 'publishing.title'
  | 'publishing.subtitle'
  | 'publishing.eyebrow'
  | 'publishing.encouragement'
  | 'publishing.scheduleRelease'
  | 'publishing.overview'
  | 'publishing.releaseQueue'
  | 'publishing.readerFeedback'
  | 'publishing.drafts'
  | 'publishing.scheduled'
  | 'publishing.published'
  | 'publishing.publishNow'
  | 'publishing.scheduleFor'
  | 'publishing.moderation'
  | 'publishing.moderationPending'
  | 'publishing.moderationApproved'
  | 'publishing.moderationRejected'
  | 'publishing.loading'
  | 'publishing.statStories'
  | 'publishing.statScheduled'
  | 'publishing.statInReview'
  | 'publishing.statPublishedLive'
  | 'publishing.statStoriesHint'
  | 'publishing.statScheduledHint'
  | 'publishing.statInReviewHint'
  | 'publishing.statPublishedHint'
  | 'publishing.postPublishHealth'
  | 'publishing.leadsWith'
  | 'publishing.readersAcross'
  | 'publishing.openAnalytics'
  | 'publishing.scheduledReleases'
  | 'publishing.noScheduledLink'
  | 'publishing.publishedContent'
  | 'publishing.noPublished'
  | 'publishing.viewChapter'
  | 'publishing.analytics'
  | 'publishing.noFeedback'
  | 'publishing.noQueue'
  | 'publishing.openEditor'
  | 'publishing.live'
  | 'publishing.statusDraft'
  | 'publishing.statusNeedsEdits'
  | 'publishing.tabsLabel'
  | 'analytics.backToChapters'
  | 'analytics.backToPublishing'
  | 'media.eyebrow'
  | 'media.subtitle'
  | 'media.uploadAsset'
  | 'media.attribution'
  | 'media.license'
  | 'media.uploadImage'
  | 'media.assets'
  | 'media.empty'
  | 'storyBible.eyebrow'
  | 'storyBible.subtitle'
  | 'storyBible.characters'
  | 'storyBible.world'
  | 'storyBible.team'
  | 'storyBible.addCharacter'
  | 'storyBible.addEntry'
  | 'storyBible.addTask'
  | 'storyBible.taskPlaceholder'
  | 'storyBible.assignee'
  | 'storyBible.unassigned'
  | 'storyBible.backToChapters'
  | 'manuscript.eyebrow'
  | 'manuscript.subtitle'
  | 'manuscript.bookshelf'
  | 'manuscript.addChapter'
  | 'manuscript.backToLibrary'
  | 'manuscript.storyBible'
  | 'manuscript.media'
  | 'schedule.title'
  | 'schedule.subtitle'
  | 'schedule.eyebrow'
  | 'schedule.formTitle'
  | 'schedule.formLead'
  | 'schedule.story'
  | 'schedule.chapter'
  | 'schedule.publishAt'
  | 'schedule.confirm'
  | 'schedule.confirming'
  | 'schedule.formNote'
  | 'schedule.calendar'
  | 'schedule.upcoming'
  | 'schedule.weekly'
  | 'schedule.biweekly'
  | 'schedule.irregular'
  | 'schedule.complete'
  | 'schedule.noScheduled'
  | 'schedule.addChapter'
  | 'schedule.emptyStories'
  | 'schedule.prevMonth'
  | 'schedule.nextMonth'
  | 'schedule.alreadyScheduled'
  | 'schedule.cancelConfirm'
  | 'schedule.newPublishTime'
  | 'schedule.weekdaySun'
  | 'schedule.weekdayMon'
  | 'schedule.weekdayTue'
  | 'schedule.weekdayWed'
  | 'schedule.weekdayThu'
  | 'schedule.weekdayFri'
  | 'schedule.weekdaySat'
  | 'community.title'
  | 'community.subtitle'
  | 'community.eyebrow'
  | 'community.heroTitle'
  | 'community.heroSubtitle'
  | 'community.kathaFirst'
  | 'community.kathaFirstHint'
  | 'community.shareInKatha'
  | 'community.feedTitle'
  | 'community.feedPlaceholder'
  | 'community.externalLater'
  | 'community.tags'
  | 'community.discussions'
  | 'community.feedback'
  | 'community.requestTag'
  | 'community.members'
  | 'community.composerLabel'
  | 'community.composerPlaceholder'
  | 'community.attachStory'
  | 'community.attachChapter'
  | 'community.createStoryFirst'
  | 'community.postToFeed'
  | 'community.feedEmptyTitle'
  | 'community.chapter'
  | 'community.love'
  | 'community.signalLetters'
  | 'community.signalReactions'
  | 'community.signalWarmth'
  | 'community.chapterShort'
  | 'login.continueGoogle'
  | 'login.continueEmail'
  | 'login.emailLabel'
  | 'login.emailPlaceholder'
  | 'login.sendCode'
  | 'login.sending'
  | 'login.back'
  | 'login.penName'
  | 'login.penNamePlaceholder'
  | 'login.otpLabel'
  | 'login.otpPlaceholder'
  | 'login.sentTo'
  | 'login.enterStudio'
  | 'login.verifying'
  | 'login.resend'
  | 'login.resendIn'
  | 'login.changeEmail'
  | 'login.mockMode'
  | 'onboarding.welcome'
  | 'onboarding.progress'
  | 'onboarding.step1Title'
  | 'onboarding.step1Desc'
  | 'onboarding.step2Title'
  | 'onboarding.step2Desc'
  | 'onboarding.step3Title'
  | 'onboarding.step3Desc'
  | 'onboarding.step4Title'
  | 'onboarding.step4Desc'
  | 'onboarding.beginManuscript'
  | 'onboarding.skipDashboard'
  | 'onboarding.whatsappSubtitle'
  | 'monetization.eyebrow'
  | 'monetization.title'
  | 'monetization.subtitle'
  | 'monetization.charter'
  | 'monetization.trustLadder'
  | 'monetization.trustLead'
  | 'monetization.eligible'
  | 'monetization.path'
  | 'monetization.spi'
  | 'monetization.spiLead'
  | 'monetization.revenue'
  | 'monetization.patronage'
  | 'monetization.launchFlow'
  | 'monetization.shortStory'
  | 'monetization.vocabulary'
  | 'monetization.surfaces'
  | 'monetization.avoid'
  | 'monetization.preferred'
  | 'settings.eyebrow'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.profile'
  | 'settings.payout'
  | 'settings.payoutLead'
  | 'settings.legalName'
  | 'settings.upi'
  | 'settings.taxId'
  | 'settings.savePayout'
  | 'settings.saving'
  | 'settings.appearance'
  | 'settings.comfort'
  | 'settings.devices'
  | 'settings.cache'
  | 'settings.labs'
  | 'settings.signOut'
  | 'profile.eyebrow'
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.penName'
  | 'profile.tagline'
  | 'profile.genres'
  | 'profile.save'
  | 'profile.saved'
  | 'profile.totalReads'
  | 'profile.storyTrust'
  | 'profile.stories'
  | 'profile.nextLevel'
  | 'reviewers.navReview'
  | 'reviewers.navRequest'
  | 'reviewers.navPool'
  | 'reviewers.navAdmin'
  | 'reviewers.waiting'
  | 'reviewers.dashboard'
  | 'reviewers.toRead'
  | 'reviewers.active'
  | 'reviewers.getFeedback'
  | 'reviewers.browseJoin'
  | 'championship.eyebrow'
  | 'championship.title'
  | 'championship.subtitle'
  | 'championship.league'
  | 'championship.magazine'
  | 'championship.requiresDebut'
  | 'championship.comingPhase'
  | 'dashboard.debutEyebrow'
  | 'dashboard.debutTitle'
  | 'dashboard.debutHint'
  | 'dashboard.debutCta'
  | 'dashboard.debutEnroll'
  | 'dashboard.debutGradEyebrow'
  | 'dashboard.debutGradTitle'
  | 'dashboard.debutGradTe'
  | 'dashboard.debutGradBody'
  | 'dashboard.debutGradShare'
  | 'dashboard.debutGradCopy'
  | 'dashboard.debutGradCta'
  | 'dashboard.chapters'
  | 'dashboard.metricsReads'
  | 'dashboard.metricsSubs'
  | 'dashboard.metricsEarnings'
  | 'dashboard.metricsTrust'
  | 'dashboard.demoBanner'
  | 'stats.writingStreak'
  | 'stats.badge'
  | 'stats.storyTrust'
  | 'stats.teluguCraft';

type StudioStrings = Record<StudioStringKey, string>;

const STRINGS: Record<StudioLocale, StudioStrings> = {
  te: {
    'nav.dashboard': 'డ్యాష్‌బోర్డ్',
    'nav.stories': 'గ్రంధాల లైబ్రరీ',
    'nav.events': 'ఈవెంట్లు',
    'nav.publishing': 'ప్రచురణ',
    'nav.schedule': 'షెడ్యూల్',
    'nav.community': 'కమ్యూనిటీ',
    'nav.reviewers': 'రివ్యూయర్ పూల్',
    'nav.monetization': 'సంపాదన',
    'nav.moderation': 'మోడరేషన్',
    'nav.search': 'వెతకండి…',
    'nav.profile': 'ప్రొఫైల్',
    'nav.settings': 'సెట్టింగ్స్',
    'nav.signOut': 'సైన్ అవుట్',
    'nav.languageToggle': 'English',
    'nav.languageToggleAria': 'ఇంగ్లీష్‌కి మారండి',
    'common.save': 'సేవ్ చేయండి',
    'common.cancel': 'రద్దు',
    'common.share': 'షేర్ చేయండి',
    'common.delete': 'తొలగించండి',
    'common.edit': 'ఎడిట్',
    'common.create': 'సృష్టించండి',
    'common.submit': 'సబ్మిట్',
    'common.back': 'వెనక్కి',
    'common.next': 'తర్వాత',
    'common.close': 'మూసివేయండి',
    'common.loading': 'లోడ్ అవుతోంది…',
    'common.error': 'ఏదో తప్పు జరిగింది',
    'common.retry': 'మళ్ళీ ప్రయత్నించండి',
    'common.comingSoon': 'త్వరలో వస్తుంది',
    'common.search': 'వెతకండి',
    'common.filter': 'ఫిల్టర్',
    'common.upload': 'అప్‌లోడ్',
    'common.download': 'డౌన్‌లోడ్',
    'common.copy': 'కాపీ',
    'common.copied': 'కాపీ అయ్యింది!',
    'common.required': 'తప్పనిసరి',
    'common.optional': 'ఐచ్ఛికం',
    'common.yes': 'అవును',
    'common.no': 'కాదు',
    'common.confirm': 'నిర్ధారించండి',
    'common.viewAll': 'అన్నీ చూడండి',
    'common.learnMore': 'మరింత తెలుసుకోండి',
    'createStory.title': 'మీ కథను సృష్టించండి',
    'createStory.subtitle': 'మీ హృదయంలోని కథకు ఇక్కడే తలుపు తెరవండి — ప్రతి గ్రంథం ఒక కొత్త ప్రపంచాన్ని పుడుస్తుంది.',
    'createStory.eyebrow': 'కొత్త కథ',
    'createStory.storyTitle': 'కథ పేరు *',
    'createStory.storyTitlePlaceholder': 'ఉదా: ప్రేమ కథ లేదా prema katha',
    'createStory.contentType': 'కంటెంట్ రకం *',
    'createStory.primaryGenre': 'ప్రధాన జానర్ *',
    'createStory.secondaryGenres': 'అదనపు జానర్లు (గరిష్ఠ 3)',
    'createStory.ageRating': 'వయస్సు రేటింగ్ *',
    'createStory.language': 'భాష *',
    'createStory.completionStatus': 'పూర్తి స్థితి',
    'createStory.setting': 'నేపథ్యం',
    'createStory.settingPlaceholder': 'ఉదా: హైదరాబాద్, 1990ల గ్రామం',
    'createStory.themes': 'థీమ్స్ (కామాలతో వేరు చేయండి)',
    'createStory.themesPlaceholder': 'కుటుంబం, గుర్తింపు, ప్రతీకారం',
    'createStory.communityTags': 'కమ్యూనిటీ ట్యాగ్లు',
    'createStory.tagSearchPlaceholder': 'ట్యాగ్లు వెతకండి…',
    'createStory.description': 'వివరణ',
    'createStory.descriptionPlaceholder': 'పాఠకులకు కనిపించే చిన్న హుక్ రాయండి…',
    'createStory.releaseSchedule': 'రిలీజ్ షెడ్యూల్',
    'createStory.coverImage': 'కవర్ చిత్రం *',
    'createStory.coverHint': 'లైవ్ కావడానికి ముందు కవర్ తప్పనిసరి. 600×900 (2:3), JPG/PNG 1MB లోపు.',
    'createStory.coverPlaceholder': '600×900 (2:3) సిఫార్సు',
    'createStory.coverUpload': 'కవర్ అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి',
    'createStory.submit': 'కథ సృష్టించి 1వ అధ్యాయం రాయండి',
    'createStory.submitting': 'సృష్టిస్తోంది…',
    'createStory.coverRequired': 'ప్రచురించే ముందు కవర్ చిత్రం తప్పనిసరి.',
    'createStory.moodTagsHint': 'మూడ్ ట్యాగ్లు',
    'createStory.requestTag': 'కొత్త ట్యాగ్ అభ్యర్థన',
    'createStory.wizardSteps': 'కథ సృష్టి దశలు',
    'createStory.stepIdentity': 'గుర్తింపు',
    'createStory.stepFormat': 'ఫార్మాట్',
    'createStory.stepPublish': 'ప్రచురణ',
    'createStory.essentials': 'అవసరమైన వివరాలు',
    'createStory.advancedDetails': 'అదనపు వివరాలు (ఐచ్ఛికం)',
    'createStory.sidecardTitle': 'మీ కథ — మీ గౌరవం',
    'createStory.sidecardText': 'తెలుగు పాఠకులకు నిజమైన కథలు. మొదటి అధ్యాయం రాసిన తర్వాత డెబ్యూ సీజన్ ప్రయాణం ప్రారంభమవుతుంది.',
    'createStory.submitHint': 'కవర్ + శీర్షిక తప్పనిసరి — తర్వాత సీన్ ఎడిటర్ తెరుచుకుంటుంది.',
    'stories.prideTitle': 'మీ కథలు — మీ గుర్తింపు',
    'stories.prideText': 'ప్రతి గ్రంథం మీ చేతి వ్రాత. మరో అధ్యాయం రాయండి, పాఠకులతో పంచుకోండి.',
    'notifications.eyebrow': 'అలర్ట్‌లు',
    'notifications.title': 'నోటిఫికేషన్‌లు',
    'notifications.subtitle': 'సమీక్ష, ప్రచురణ, మోడరేషన్ — ఒకే చోట.',
    'notifications.marking': 'మార్క్ చేస్తోంది…',
    'notifications.markAll': 'అన్నీ చదివినట్లు',
    'notifications.filterAll': 'అన్నీ',
    'notifications.filterReview': 'సమీక్ష',
    'notifications.filterPublish': 'ప్రచురణ',
    'notifications.filterModeration': 'మోడరేషన్',
    'notifications.emptyTitle': 'ఈ ఫిల్టర్‌లో అలర్ట్‌లు లేవు',
    'notifications.emptyText': 'సమీక్ష ఆహ్వానాలు, ప్రచురణ నవీకరణలు ఇక్కడ కనిపిస్తాయి.',
    'notifications.open': 'తెరవండి',
    'moderation.eyebrow': 'నమ్మకం & భద్రత',
    'moderation.title': 'మోడరేషన్ క్యూ',
    'moderation.subtitle': 'ఫ్లాగ్ అయిన అధ్యాయాలు — స్పష్టమైన నిర్ణయం, గౌరవప్రదమైన సందేశం.',
    'moderation.filterLabel': 'క్యూ ఫిల్టర్',
    'moderation.filterPending': 'పెండింగ్ మాత్రమే',
    'moderation.filterAll': 'అన్నీ',
    'moderation.refresh': 'రిఫ్రెష్',
    'moderation.loading': 'క్యూ లోడ్ అవుతోంది…',
    'moderation.emptyTitle': 'క్యూ ఖాళీ',
    'moderation.emptyText': 'పెండింగ్ అధ్యాయాలు లేవు — మంచి పని!',
    'moderation.pending': 'పెండింగ్',
    'moderation.toxicity': 'టాక్సిసిటీ',
    'moderation.chapter': 'అధ్యాయం',
    'moderation.untitled': 'శీర్షిక లేదు',
    'moderation.notesLabel': 'సమీక్షక గమనికలు (ఐచ్ఛికం)',
    'moderation.notesPlaceholder': 'నిర్ణయానికి కారణం — అపీల్‌లో కనిపిస్తుంది',
    'moderation.approve': 'ఆమోదం',
    'moderation.requestEdits': 'సవరణలు అడగండి',
    'moderation.reject': 'తిరస్కరించు',
    'moderation.prevPage': 'మునుపటి',
    'moderation.nextPage': 'తదుపరి',
    'moderation.page': 'పేజీ',
    'stories.title': 'నా కథలు',
    'stories.subtitle': 'డ్రాఫ్ట్లు, ధారావాహిక అధ్యాయాలు, పాఠకుల స్థితి — అన్నీ ఒకే చోట.',
    'stories.eyebrow': 'గ్రంథాలయం',
    'stories.newStory': 'కొత్త కథ',
    'stories.empty': 'ఇంకా కథలు లేవు. మొదటి కథను సృష్టించండి!',
    'stories.draft': 'డ్రాఫ్ట్',
    'stories.ongoing': 'కొనసాగుతోంది',
    'stories.completed': 'పూర్తయింది',
    'stories.chapters': 'అధ్యాయాలు',
    'stories.readers': 'పాఠకులు',
    'stories.lastUpdated': 'చివరి అప్‌డేట్',
    'stories.manage': 'నిర్వహించండి',
    'stories.write': 'రాయండి',
    'stories.searchPlaceholder': 'కథ పేరు లేదా prema katha వంటి శోధన…',
    'stories.filterStatus': 'స్థితి ఫిల్టర్',
    'stories.allStatuses': 'అన్ని స్థితులు',
    'stories.statusPublished': 'ప్రచురించబడింది',
    'stories.statusPendingReview': 'రివ్యూ పెండింగ్',
    'stories.statusNeedsRevision': 'మార్పులు అవసరం',
    'stories.noMatchTitle': 'సరిపోలే కథలు లేవు',
    'stories.noMatchText': 'వేరే శోధన పదం లేదా ఫిల్టర్ ప్రయత్నించండి.',
    'stories.clearFilters': 'ఫిల్టర్లు క్లియర్ చేయండి',
    'stories.loading': 'మీ గ్రంథాలయం తెరుస్తోంది…',
    'stories.emptyShelfTitle': 'మీ షెల్ఫ్ సిద్ధంగా ఉంది',
    'stories.emptyShelfTe': 'మీ గ్రంథాలయం మొదటి కథ కోసం సిద్ధంగా ఉంది',
    'stories.emptyShelfText': 'ప్రతి గొప్ప తెలుగు కథ ఒక్క అధ్యాయంతో మొదలవుతుంది. ఈరోజే మీది రాయండి — పాఠకులు మీ తలుపు కోసం ఎదురు చూస్తున్నారు.',
    'stories.createFirst': 'మొదటి కథ సృష్టించండి',
    'stories.openManuscript': 'గ్రంథం తెరవండి',
    'stories.continueWriting': 'కొనసాగించండి',
    'stories.analytics': 'అనలిటిక్స్',
    'stories.archiveConfirm': 'ఆర్కైవ్ చేయాలా? అధ్యాయాలు పాఠకులకు కనిపించవు.',
    'shareModal.title': 'లింక్ షేర్ చేయండి',
    'shareModal.selectChapter': 'అధ్యాయం ఎంచుకోండి',
    'shareModal.copyLink': 'లింక్ కాపీ',
    'shareModal.freeHint': 'చందా లేని పాఠకులు మొదటి 10 అధ్యాయాలు ఉచితంగా చదువుతారు.',
    'shareModal.linkLabel': 'షేర్ లింక్',
    'events.title': 'ఈవెంట్లు & పోటీలు',
    'events.subtitle': 'మీ అవతరణ కాలం ప్రయాణం — 50 అధ్యాయాల ధారావాహిక కథ, గుర్తింపు బహుమతులు, తెలుగు కళా గౌరవం.',
    'events.eyebrow': 'సృజనాత్మక కార్యక్రమాలు',
    'events.hostEvent': 'ఈవెంట్ హోస్ట్ చేయండి',
    'events.openEvents': 'తెరిచి ఉన్న ఈవెంట్లు',
    'events.myEvents': 'నా ఈవెంట్లు',
    'events.register': 'రిజిస్టర్',
    'events.registered': 'రిజిస్టర్ అయ్యారు',
    'events.submit': 'సబ్మిట్ చేయండి',
    'events.prizePool': 'బహుమతి నిధి',
    'events.freeEntry': 'ఉచిత ఎంట్రీ',
    'events.paidEntry': 'చెల్లింపు ఎంట్రీ',
    'events.deadline': 'చివరి తేదీ',
    'events.join': 'పాల్గొనండి',
    'events.viewEvent': 'ఈవెంట్ చూడండి',
    'events.viewRegistration': 'మీ నమోదు చూడండి',
    'events.upcomingClosed': 'రాబోయే & ముగిసినవి',
    'events.emptyTitle': 'ఇంకా ఈవెంట్లు లేవు',
    'events.emptyText': 'ప్లాట్‌ఫారమ్ పోటీలు తెరిచినప్పుడు తిరిగి చూడండి, లేదా అవతరణ కాలంలో పాల్గొనండి.',
    'events.debutHeroTitle': 'కథా అవతరణ కాలం',
    'events.debutHeroSubtitle': 'మీ మొదటి ధారావాహిక కథ — 50 అధ్యాయాల ప్రయాణం. గుర్తింపు, బ్యాజ్లు, ప్రమాణపత్రాలు — నగదు కాదు.',
    'events.debutJourney': 'రచయిత ప్రయాణం',
    'events.debutEvaluation': 'మూల్యాంకన కోణాలు',
    'events.debutProgress': 'మీ అవతరణ పురోగతి',
    'events.debutChapters': 'అధ్యాయాలు',
    'events.hostPrivilege': 'ఈవెంట్ హోస్ట్ చేయడం ఎలిట్ సృజనకర్తలకు మాత్రమే — అగ్ర 25 ర్యాంక్ రచయితలు, రివ్యూయర్లు, లేదా కథా ఫౌండర్లు.',
    'events.registeredCount': 'నమోదైనవారు',
    'events.recognitionPrizes': 'గుర్తింపు బహుమతులు',
    'events.resultsDate': 'ఫలితాల ప్రకటన (అంచనా)',
    'events.selectStory': 'మీ కథా గ్రంథాల నుండి ఎంచుకోండి',
    'events.eligibilityBlocked': 'ఈ కథ అవతరణ కాలం అర్హతలకు అనుగుణంగా లేదు',
    'events.createTitle': 'ఈవెంట్ సృష్టించండి',
    'events.createSubtitle': 'కమ్యూనిటీ కార్యక్రమాన్ని ప్రారంభించండి — ఉచిత ఎంట్రీ, గుర్తింపు బహుమతులు.',
    'events.publishOpen': 'ప్రచురించి నమోదు తెరవండి',
    'events.wizardEyebrow': 'ఈవెంట్ విజార్డ్',
    'events.wizardStepsLabel': 'ఈవెంట్ సృష్టి దశలు',
    'events.wizardStepBasic': 'ప్రాథమిక సమాచారం',
    'events.wizardStepEligibility': 'అర్హత',
    'events.wizardStepRegistration': 'నమోదు',
    'events.wizardStepPrizes': 'గుర్తింపు బహుమతులు',
    'events.wizardStepJudging': 'మూల్యాంకన మోడల్',
    'events.wizardStepTimeline': 'కాలపట్టిక',
    'events.wizardStepPublishing': 'ప్రచురణ',
    'events.eventTitle': 'ఈవెంట్ పేరు',
    'events.description': 'వివరణ',
    'events.eventType': 'ఈవెంట్ రకం',
    'events.titlePlaceholder': 'ఉదా: కథా అవతరణ కాలం — వసంతం',
    'events.descriptionPlaceholder': 'పాఠకులు మరియు రచయితలకు కనిపించే సంక్షిప్త వివరణ…',
    'events.eligibilityDesc': 'తెలుగు భాష, ధారావాహిక కథ ఫార్మాట్, డ్రాఫ్ట్ లేదా కొనసాగుతోంది స్థితి — అవతరణ కాలం అర్హతలు.',
    'events.registrationDesc': 'అన్ని కథా ఈవెంట్లు ఉచిత నమోదు — నగదు ఎంట్రీ ఫీజులు లేవు.',
    'events.timelineDesc': 'కాలపట్టిక: నమోదు → సబ్మిషన్లు → మూల్యాంకనం → ఫలితాల ప్రకటన. ప్రచురణ తర్వాత తేదీలు సెట్ చేయండి.',
    'events.publishingDesc': 'ప్రచురించిన వెంటనే నమోదు తెరుచుకుంటుంది. గుర్తింపు బహుమతులు మాత్రమే — బ్యాజ్లు, ప్రమాణపత్రాలు, ఫీచర్లు.',
    'events.judgingModel': 'మూల్యాంకన మోడల్',
    'events.openingRegistration': 'నమోదు తెరుస్తోంది…',
    'events.titleRequired': 'ప్రచురించే ముందు ఈవెంట్ పేరు జోడించండి.',
    'events.hostBlockedTitle': 'ఎలిట్ హోస్ట్ అర్హత',
    'events.eventDetails': 'ఈవెంట్ వివరాలు',
    'events.type': 'రకం',
    'events.status': 'స్థితి',
    'events.judging': 'మూల్యాంకనం',
    'events.entry': 'ఎంట్రీ',
    'events.submissions': 'సబ్మిషన్లు',
    'events.evaluationRubric': 'మూల్యాంకన రూబ్రిక్',
    'events.registrationCloses': 'నమోదు ముగిసే తేదీ',
    'events.submissionsClose': 'సబ్మిషన్ ముగిసే తేదీ',
    'events.debutSeasonEyebrow': 'అవతరణ కాలం · గుర్తింపు బహుమతులు',
    'events.creativeContest': 'సృజనాత్మక పోటీ',
    'events.freeRegistrationHint': 'ఉచిత నమోదు — గుర్తింపు బహుమతులు మరియు బ్యాజ్లు మాత్రమే.',
    'events.submittedStory': 'సబ్మిట్ చేసిన కథ',
    'events.registrationClosed': 'ఈ ఈవెంట్‌కు నమోదు ముగిసింది.',
    'events.registrationComplete': 'నమోదు పూర్తయింది — సిద్ధమైనప్పుడు మీ కథను సబ్మిట్ చేయండి.',
    'events.alreadyRegistered': 'మీరు ఇప్పటికే నమోదు అయ్యారు.',
    'events.registering': 'నమోదు అవుతోంది…',
    'events.submitting': 'సబ్మిట్ అవుతోంది…',
    'events.noStories': 'ఇంకా కథలు లేవు.',
    'events.createManuscript': 'కథ సృష్టించండి',
    'events.chooseStoryError': 'మీ లైబ్రరీ నుండి కథ ఎంచుకోండి',
    'events.submittedFor': 'మూల్యాంకనానికి సబ్మిట్ అయ్యింది',
    'events.debutSeasonBadge': 'అవతరణ కాలం',
    'events.dimension': 'కోణం',
    'events.weight': 'బరువు',
    'events.debutArcChapters': 'అవతరణ అధ్యాయాలు',
    'events.debutSeasonFree': 'అవతరణ కాలం · ఉచితం',
    'events.journeyRegister': 'నమోదు',
    'events.journeyWrite': 'రాయండి',
    'events.journeySubmit': 'సబ్మిట్',
    'events.journeyEvaluate': 'మూల్యాంకనం',
    'events.journeyRecognition': 'గుర్తింపు',
    'events.rulesTitle': 'పోటీ నియమాలు',
    'events.rulesEligibility': 'అర్హత',
    'events.rulesJudging': 'మూల్యాంకనం',
    'events.rulesPrizes': 'బహుమతులు',
    'events.rulesTimeline': 'కాలపట్టిక',
    'events.rulesAccept': 'నేను పోటీ నియమాలను చదివి అంగీకరిస్తున్నాను',
    'events.rulesMustAccept': 'నమోదు చేయడానికి ముందు పోటీ నియమాలను అంగీకరించండి',
    'events.rulesVersion': 'నియమాల వెర్షన్',
    'events.rulesRecognitionOnly': 'గుర్తింపు బహుమతులు మాత్రమే — నగదు లేదు',
    'events.rulesNoCash': 'నగదు బహుమతులు లేవు',
    'events.statusRegistrationOpen': 'నమోదు తెరిచి ఉంది',
    'events.statusSubmissionsOpen': 'సబ్మిషన్లు తెరిచి ఉన్నాయి',
    'events.statusPublished': 'ప్రచురించబడింది',
    'events.statusJudging': 'మూల్యాంకనం జరుగుతోంది',
    'events.statusCompleted': 'పూర్తయింది',
    'events.statusDraft': 'డ్రాఫ్ట్',
    'events.statusCancelled': 'రద్దు చేయబడింది',
    'publishing.title': 'రిలీజ్ ఆపరేషన్స్',
    'publishing.subtitle': 'డ్రాఫ్ట్ల నుండి లైవ్ అధ్యాయాల వరకు — మీ ప్రచురణ ఇక్కడే.',
    'publishing.eyebrow': 'ప్రచురణ కేంద్రం · Publishing Center',
    'publishing.encouragement': 'మీ కథ ప్రపంచం పెరుగుతోంది. ప్రతి అధ్యాయం మీ పాఠకులకు చేరువయ్యే మరో అడుగు — షెడ్యూల్ చేయండి, ట్రాక్ చేయండి, విజయాన్ని జరుపుకోండి.',
    'publishing.scheduleRelease': 'రిలీజ్ షెడ్యూల్ చేయండి',
    'publishing.overview': 'అవలోకనం',
    'publishing.releaseQueue': 'రిలీజ్ క్యూ',
    'publishing.readerFeedback': 'పాఠకుల అభిప్రాయం',
    'publishing.drafts': 'డ్రాఫ్ట్లు',
    'publishing.scheduled': 'షెడ్యూల్ చేసినవి',
    'publishing.published': 'ప్రచురించినవి',
    'publishing.publishNow': 'ఇప్పుడే ప్రచురించండి',
    'publishing.scheduleFor': 'షెడ్యూల్ చేయండి',
    'publishing.moderation': 'మోడరేషన్',
    'publishing.moderationPending': 'మోడరేషన్ పెండింగ్',
    'publishing.moderationApproved': 'ఆమోదించబడింది',
    'publishing.moderationRejected': 'తిరస్కరించబడింది',
    'publishing.loading': 'ప్రచురణ డేటా లోడ్ అవుతోంది…',
    'publishing.statStories': 'కథలు',
    'publishing.statScheduled': 'షెడ్యూల్ చేసినవి',
    'publishing.statInReview': 'రివ్యూలో',
    'publishing.statPublishedLive': 'లైవ్ ప్రచురణ',
    'publishing.statStoriesHint': 'మీ స్టూడియోలో సక్రియ గ్రంథాలు',
    'publishing.statScheduledHint': 'రాబోయే ఆటో-ప్రచురణ స్లాట్లు',
    'publishing.statInReviewHint': 'ఎడిటోరియల్ చర్య కోసం వేచి ఉన్న అధ్యాయాలు',
    'publishing.statPublishedHint': 'పాఠకులకు ప్రస్తుతం లైవ్ అధ్యాయాలు',
    'publishing.postPublishHealth': 'ప్రచురణ తర్వాత ఆరోగ్యం',
    'publishing.leadsWith': 'ముందున్నది',
    'publishing.readersAcross': 'పాఠకులు · అధ్యాయాలు',
    'publishing.openAnalytics': 'కథ యానలిటిక్స్ తెరవండి',
    'publishing.scheduledReleases': 'షెడ్యూల్ చేసిన రిలీజ్‌లు',
    'publishing.noScheduledLink': 'షెడ్యూల్ చేసిన రిలీజ్‌లు లేవు.',
    'publishing.publishedContent': 'ప్రచురించిన కంటెంట్',
    'publishing.noPublished': 'ఇంకా ప్రచురించిన అధ్యాయాలు లేవు. అధ్యాయం ఎడిటర్ నుండి సబ్మిట్ చేసి మోడరేషన్ పాస్ చేయండి.',
    'publishing.viewChapter': 'అధ్యాయం చూడండి',
    'publishing.analytics': 'యానలిటిక్స్',
    'publishing.noFeedback': 'పాఠకుల అభిప్రాయం స్వీకరించడానికి కథ ప్రచురించండి.',
    'publishing.noQueue': 'మోడరేషన్‌లో అధ్యాయాలు లేవు. సిద్ధమైనప్పుడు అధ్యాయం ఎడిటర్ నుండి సబ్మిట్ చేయండి.',
    'publishing.openEditor': 'ఎడిటర్ తెరవండి',
    'publishing.live': 'లైవ్',
    'publishing.statusDraft': 'డ్రాఫ్ట్',
    'publishing.statusNeedsEdits': 'సవరణలు అవసరం',
    'publishing.tabsLabel': 'ప్రచురణ విభాగాలు',
    'analytics.backToChapters': 'అధ్యాయాలకు వెనక్కి',
    'analytics.backToPublishing': 'ప్రచురణకు వెనక్కి',
    'media.eyebrow': 'మీడియా లైబ్రరీ · Media Library',
    'media.subtitle': 'కవర్ చిత్రాలు, చిత్రీకరణలు, రిఫరెన్స్ ఆసెట్లు — ప్రచురణకు సిద్ధంగా ఉంచండి. ప్రతి చిత్రానికి క్రెడిట్ మరియు లైసెన్స్ జోడించండి.',
    'media.uploadAsset': 'ఆసెట్ అప్‌లోడ్',
    'media.attribution': 'క్రెడిట్ (కళాకారుడు, మూలం)',
    'media.license': 'లైసెన్స్ (ఉదా: CC BY 4.0)',
    'media.uploadImage': 'చిత్రం అప్‌లోడ్',
    'media.assets': 'ఆసెట్లు',
    'media.empty': 'ఇంకా మీడియా లేదు — కవర్లు మరియు చిత్రీకరణలు అప్‌లోడ్ చేయండి.',
    'storyBible.eyebrow': 'కథా బైబిల్ · Story Bible',
    'storyBible.subtitle': 'పాత్రలు, ప్రపంచం, బృందం — మీ కథ యొక్క ఖచ్చితమైన రికార్డ్. సహ-రచయితలతో సమన్వయం ఇక్కడే.',
    'storyBible.characters': 'పాత్రలు',
    'storyBible.world': 'ప్రపంచం & లోర్',
    'storyBible.team': 'బృందం & టాస్క్‌లు',
    'storyBible.addCharacter': 'పాత్ర జోడించండి',
    'storyBible.addEntry': 'ఎంట్రీ జోడించండి',
    'storyBible.addTask': 'టాస్క్ జోడించండి',
    'storyBible.taskPlaceholder': 'సహకార టాస్క్ (ఉదా: అధ్యాయం 3 రివ్యూ)',
    'storyBible.assignee': 'బాధ్యత',
    'storyBible.unassigned': 'కేటాయించలేదు',
    'storyBible.backToChapters': 'అధ్యాయాలకు వెనక్కి',
    'manuscript.eyebrow': 'గ్రంధం · Manuscript',
    'manuscript.subtitle': 'మీ అధ్యాయాల బుక్‌షెల్ఫ్ — రాయండి, సవరించండి, ప్రచురించండి.',
    'manuscript.bookshelf': 'అధ్యాయ బుక్‌షెల్ఫ్',
    'manuscript.addChapter': 'అధ్యాయం జోడించండి',
    'manuscript.backToLibrary': 'లైబ్రరీకి వెనక్కి',
    'manuscript.storyBible': 'కథా బైబిల్',
    'manuscript.media': 'మీడియా',
    'schedule.title': 'ప్రచురణ క్యాలెండర్',
    'schedule.subtitle': 'అధ్యాయం ఎప్పుడు లైవ్ అవుతుందో ఎంచుకోండి — మీరు ఆన్‌లైన్‌లో లేకపోయినా స్వయంచాలకంగా ప్రచురిస్తుంది.',
    'schedule.eyebrow': 'ప్రచురణ క్యాలెండర్ · Publishing Calendar',
    'schedule.formTitle': 'ప్రచురణ షెడ్యూల్ చేయండి',
    'schedule.formLead': 'కథ, అధ్యాయం, తేదీ — మూడు స్టెప్‌లలో మీ రిలీజ్ ప్లాన్ చేయండి.',
    'schedule.story': 'కథ',
    'schedule.chapter': 'అధ్యాయం',
    'schedule.publishAt': 'ప్రచురణ తేదీ & సమయం',
    'schedule.confirm': 'షెడ్యూల్ నిర్ధారించండి',
    'schedule.confirming': 'నిర్ధారిస్తోంది…',
    'schedule.formNote': 'మీరు ఎంచుకున్న సమయానికి అధ్యాయం లైవ్ అవుతుంది. అప్పటి వరకు రీషెడ్యూల్ లేదా రద్దు చేయవచ్చు.',
    'schedule.calendar': 'క్యాలెండర్',
    'schedule.upcoming': 'రాబోయే రిలీజ్‌లు',
    'schedule.weekly': 'ప్రతి వారం',
    'schedule.biweekly': 'ప్రతి రెండు వారాలకు',
    'schedule.irregular': 'సిద్ధమైనప్పుడు',
    'schedule.complete': 'కథ పూర్తయింది',
    'schedule.noScheduled': 'షెడ్యూల్ చేసిన అధ్యాయాలు లేవు',
    'schedule.addChapter': 'అధ్యాయం జోడించండి',
    'schedule.emptyStories': 'షెడ్యూల్ చేయడానికి ఇంకా కథలు లేవు. మొదటి గ్రంధాన్ని సృష్టించండి.',
    'schedule.prevMonth': 'మునుపటి నెల',
    'schedule.nextMonth': 'తదుపరి నెల',
    'schedule.alreadyScheduled': 'ఇప్పటికే షెడ్యూల్ చేయబడింది',
    'schedule.cancelConfirm': 'షెడ్యూల్ చేసిన ప్రచురణ రద్దు చేయాలా?',
    'schedule.newPublishTime': 'కొత్త ప్రచురణ సమయం',
    'schedule.weekdaySun': 'ఆ',
    'schedule.weekdayMon': 'సో',
    'schedule.weekdayTue': 'మం',
    'schedule.weekdayWed': 'బు',
    'schedule.weekdayThu': 'గు',
    'schedule.weekdayFri': 'శు',
    'schedule.weekdaySat': 'శ',
    'community.title': 'మీ పాఠక సమాజం',
    'community.subtitle': 'కథలో పాఠకులతో కనెక్ట్ అవ్వండి — మెసేజ్‌లు, ప్రతిస్పందనలు, వెచ్చదనం.',
    'community.eyebrow': 'పాఠక సమాజం · Reader Community',
    'community.heroTitle': 'మీ ప్రేక్షకులు పెరుగుతున్నారు',
    'community.heroSubtitle': 'కథలో ముందుగా షేర్ చేయండి — పాఠకుల ప్రేమ, సందేశాలు, ప్రతిస్పందనలు ఇక్కడే నిలుస్తాయి. వాట్సాప్, ఇన్‌స్టాగ్రామ్ తర్వాత.',
    'community.kathaFirst': 'ముందుగా కథలో షేర్ చేయండి',
    'community.kathaFirstHint': 'కథ పాఠకులకు రిచ్ ప్రివ్యూ, కాప్టర్, ఫాలో — బయటి సోషల్ కంటే లోపల బాండ్ బలంగా ఉంటుంది.',
    'community.shareInKatha': 'కథలో అధ్యాయం షేర్ చేయండి',
    'community.feedTitle': 'కమ్యూనిటీ ఫీడ్',
    'community.feedPlaceholder': 'పాఠకుల సందేశాలు, అధ్యాయ ప్రతిస్పందనలు, వారపు వెచ్చదనం — మీ కథలు ప్రచురించబడిన తర్వాత ఇక్కడ కనిపిస్తాయి.',
    'community.externalLater': 'వాట్సాప్ & ఇన్‌స్టాగ్రామ్ — కథలో మొదట షేర్ చేసిన తర్వాత',
    'community.tags': 'ట్యాగ్లు',
    'community.discussions': 'చర్చలు',
    'community.feedback': 'ఫీడ్‌బ్యాక్',
    'community.requestTag': 'కొత్త ట్యాగ్ అభ్యర్థన',
    'community.members': 'సభ్యులు',
    'community.composerLabel': 'కమ్యూనిటీలో పోస్ట్ చేయండి',
    'community.composerPlaceholder': 'మీ పాఠకులతో ఏమి పంచుకోవాలనుకుంటున్నారు? కథలో ముందుగా షేర్ చేయండి…',
    'community.attachStory': 'కథ ఎంచుకోండి',
    'community.attachChapter': 'అధ్యాయం',
    'community.createStoryFirst': 'మొదట కథ సృష్టించండి',
    'community.postToFeed': 'ఫీడ్‌లో పోస్ట్ చేయండి',
    'community.feedEmptyTitle': 'మీ కమ్యూనిటీ ఫీడ్ సిద్ధంగా ఉంది',
    'community.chapter': 'అధ్యాయం',
    'community.love': 'ఇష్టం',
    'community.signalLetters': 'పాఠకుల సందేశాలు',
    'community.signalReactions': 'అధ్యాయ ప్రతిస్పందనలు',
    'community.signalWarmth': 'వారపు వెచ్చదనం',
    'community.chapterShort': 'అధ్యా',
    'login.continueGoogle': 'Google తో కొనసాగండి',
    'login.continueEmail': 'ఇమెయిల్ తో కొనసాగండి',
    'login.emailLabel': 'ఇమెయిల్ చిరునామా',
    'login.emailPlaceholder': 'me@example.com',
    'login.sendCode': 'ధృవీకరణ కోడ్ పంపండి',
    'login.sending': 'పంపుతోంది…',
    'login.back': 'వెనక్కి',
    'login.penName': 'పేన్ పేరు (ఐచ్ఛికం)',
    'login.penNamePlaceholder': 'పాఠకులు మిమ్మల్ని ఎలా చూస్తారు',
    'login.otpLabel': '6 అంకెల కోడ్',
    'login.otpPlaceholder': '• • • • • •',
    'login.sentTo': 'పంపిన చిరునామా',
    'login.enterStudio': 'మీ స్టూడియోలోకి ప్రవేశించండి',
    'login.verifying': 'ధృవీకరిస్తోంది…',
    'login.resend': 'మళ్లీ పంపండి',
    'login.resendIn': 'మళ్లీ పంపడానికి',
    'login.changeEmail': 'ఇమెయిల్ మార్చండి',
    'login.mockMode': 'MOCK MODE · OTP = 123456',
    'onboarding.welcome': 'క్రియేటర్ స్టూడియోకు స్వాగతం',
    'onboarding.progress': 'పూర్తయింది',
    'onboarding.step1Title': 'మీ ఖాతా సృష్టించండి',
    'onboarding.step1Desc': 'Google లేదా ఇమెయిల్ — ఉచితంగా ప్రారంభించండి.',
    'onboarding.step2Title': 'మొదటి కథ ప్రారంభించండి',
    'onboarding.step2Desc': 'శీర్షిక, శైలి, కవర్ — మంచి కథకు పునాది.',
    'onboarding.step3Title': 'మొదటి అధ్యాయం రాయండి',
    'onboarding.step3Desc': 'సీన్ ఎడిటర్, లైవ్ ప్రివ్యూ — నిజమైన చేతి వ్రాత.',
    'onboarding.step4Title': 'ప్రచురించి పంచుకోండి',
    'onboarding.step4Desc': 'సమీక్ష తర్వాత అధ్యాయాలు లైవ్ అవుతాయి (సాధారణంగా 1–2 గంటలు).',
    'onboarding.beginManuscript': 'మొదటి కథ ప్రారంభించండి',
    'onboarding.skipDashboard': 'డాష్‌బోర్డ్‌కు వెళ్లండి',
    'onboarding.whatsappSubtitle': 'క్రియేటర్ సహాయం — WhatsApp లో ఉచిత సపోర్ట్',
    'monetization.eyebrow': 'సాహిత్య ఆదరణ · Story Trust',
    'monetization.title': 'సాహిత్య ఆదరణ & Story Trust',
    'monetization.subtitle': 'కథ సామాజిక ప్లాట్‌ఫారమ్ కాదు — నిరంతర పాఠక విలువకు గౌరవం, సాహిత్య ఆదరణ, సాధన గుర్తింపు.',
    'monetization.charter': 'బ్రాండ్ చార్టర్',
    'monetization.trustLadder': 'Story Trust సోపానం',
    'monetization.trustLead': 'Performing మరియు పైనే మానిటైజేషన్ అర్హత.',
    'monetization.eligible': 'మానిటైజేషన్ అన్‌లాక్',
    'monetization.path': 'మానిటైజేషన్ మార్గం',
    'monetization.spi': 'Story Performance Index',
    'monetization.spiLead': 'ఒకే మెట్రిక్‌పై ఆధారపడము — SPI అన్ని సిగ్నల్స్ కలుస్తుంది.',
    'monetization.revenue': 'రెవెన్యూ మోడల్',
    'monetization.patronage': 'సాహిత్య ఆదరణ',
    'monetization.launchFlow': 'మొదటి కథ ప్రారంభం',
    'monetization.shortStory': 'చిన్న కథ ఆర్థిక వ్యవస్థ',
    'monetization.vocabulary': 'కథ పదకోశం',
    'monetization.surfaces': 'మానిటైజేషన్ మైదానాలు',
    'monetization.avoid': 'తప్పనిసరిగా వద్దు',
    'monetization.preferred': 'ఇష్టమైన పదాలు',
    'settings.eyebrow': 'స్టూడియో అభిరుచులు',
    'settings.title': 'సెట్టింగ్‌లు',
    'settings.subtitle': 'ఖాతా, రూపం, స్థానిక డేటా — దీర్ఘ రచనా సెషన్లకు.',
    'settings.profile': 'క్రియేటర్ ప్రొఫైల్',
    'settings.payout': 'చెల్లింపు సిద్ధత',
    'settings.payoutLead': 'త్రైమాసిక Story Trust చెల్లింపులకు UPI మరియు చట్టపరమైన పేరు అవసరం.',
    'settings.legalName': 'చట్టపరమైన పేరు (UPI / PAN)',
    'settings.upi': 'UPI ID',
    'settings.taxId': 'PAN / టాక్స్ ID (ఐచ్ఛికం)',
    'settings.savePayout': 'చెల్లింపు వివరాలు సేవ్ చేయండి',
    'settings.saving': 'సేవ్ అవుతోంది…',
    'settings.appearance': 'రూపం',
    'settings.comfort': 'కంటి సౌకర్యం',
    'settings.devices': 'పరికరాలు',
    'settings.cache': 'స్థానిక కాష్',
    'settings.labs': 'స్టూడియో ల్యాబ్స్',
    'settings.signOut': 'సైన్ అవుట్',
    'profile.eyebrow': 'రచయిత గుర్తింపు',
    'profile.title': 'మీ ప్రొఫైల్',
    'profile.subtitle': 'మీ బహిరంగ గుర్తింపు — గర్వంగా, పాలిష్‌గా ఉంచండి.',
    'profile.penName': 'పేన్ పేరు',
    'profile.tagline': 'ట్యాగ్‌లైన్',
    'profile.genres': 'ఇష్టమైన శైలులు',
    'profile.save': 'ప్రొఫైల్ సేవ్',
    'profile.saved': 'సేవ్ అయింది',
    'profile.totalReads': 'మొత్తం చదవడాలు',
    'profile.storyTrust': 'Story Trust షేర్',
    'profile.stories': 'కథలు',
    'profile.nextLevel': 'తదుపరి స్థాయి',
    'reviewers.navReview': 'సమీక్ష',
    'reviewers.navRequest': 'అభ్యర్థన',
    'reviewers.navPool': 'పూల్',
    'reviewers.navAdmin': 'అడ్మిన్',
    'reviewers.waiting': 'వేచి ఉంది',
    'reviewers.dashboard': 'డాష్‌బోర్డ్',
    'reviewers.toRead': 'చదవాలి',
    'reviewers.active': 'యాక్టివ్',
    'reviewers.getFeedback': 'ఫీడ్‌బ్యాక్ తీసుకోండి',
    'reviewers.browseJoin': 'బ్రౌజ్ & చేరండి',
    'championship.eyebrow': 'గ్లోబల్ ఛాంపియన్‌షిప్',
    'championship.title': 'కథ గ్లోబల్ ఛాంపియన్‌షిప్',
    'championship.subtitle': 'డెబ్యూ లారియట్‌లు మరియు ప్రీమియర్ లీగ్ విజేతల కోసం — క్రాస్-లీగ్ టూర్నమెంట్.',
    'championship.league': 'ఆథర్స్ ప్రీమియర్ లీగ్',
    'championship.magazine': 'ప్రీమియం మ్యాగజైన్',
    'championship.requiresDebut': 'డెబ్యూ ఆథర్ బ్యాడ్జ్ అవసరం',
    'championship.comingPhase': 'ప్రీమియర్ లీగ్ లైవ్ అయిన తర్వాత ప్రారంభం',
    'dashboard.debutEyebrow': 'అవతరణ కాలం',
    'dashboard.debutTitle': 'మీ మొదటి నవల — గౌరవ మార్గం',
    'dashboard.debutHint': '50 అధ్యాయాలు పూర్తి చేసి Debut Author బ్యాడ్జ్ పొందండి — తర్వాత మోనెటైజేషన్ & పోటీలు.',
    'dashboard.debutCta': 'అవతరణ కాలం చూడండి',
    'dashboard.debutEnroll': 'మీ మొదటి కథ ప్రచురించినప్పుడు స్వయంచాలకంగా నమోదు అవుతుంది.',
    'dashboard.debutGradEyebrow': 'అవతరణ కాలం పూర్తి',
    'dashboard.debutGradTitle': 'అభినందనలు — మీరు అవతరణ రచయిత!',
    'dashboard.debutGradTe': 'మీ 50 అధ్యాయాల ప్రయాణం పూర్తయింది',
    'dashboard.debutGradBody': 'మీ మొదటి ధారావాహిక నవల పూర్తయింది. బ్యాడ్జ్ పొందండి — మీ గౌరవాన్ని షేర్ చేయండి.',
    'dashboard.debutGradShare': 'మీ బ్యాడ్జ్ షేర్ చేయండి',
    'dashboard.debutGradCopy': 'లింక్ కాపీ',
    'dashboard.debutGradCta': 'కొనసాగించండి',
    'dashboard.chapters': 'అధ్యాయాలు',
    'dashboard.metricsReads': 'మొత్తం చదివినవి',
    'dashboard.metricsSubs': 'చురుకైన సభ్యులు',
    'dashboard.metricsEarnings': 'ఈ నెల సంపాదన',
    'dashboard.metricsTrust': 'స్టోరీ ట్రస్ట్ వాటా',
    'dashboard.demoBanner': 'డెమో మెట్రిక్స్ — ప్రచురించిన తర్వాత నిజమైన డేటా కనిపిస్తుంది.',
    'stats.writingStreak': 'రోజులు దీపం వెలిగింది',
    'stats.badge': 'బ్యాజ్',
    'stats.storyTrust': 'స్టోరీ ట్రస్ట్',
    'stats.teluguCraft': 'తెలుగు కథా చేతి',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.stories': 'Manuscript library',
    'nav.events': 'Events',
    'nav.publishing': 'Publishing',
    'nav.schedule': 'Schedule',
    'nav.community': 'Community',
    'nav.reviewers': 'Reviewer Pool',
    'nav.monetization': 'Earn',
    'nav.moderation': 'Moderation',
    'nav.search': 'Search…',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'nav.languageToggle': 'తెలుగు',
    'nav.languageToggleAria': 'Switch to Telugu',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.share': 'Share',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
    'common.loading': 'Loading…',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',
    'common.comingSoon': 'Coming soon',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.upload': 'Upload',
    'common.download': 'Download',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    'common.viewAll': 'View all',
    'common.learnMore': 'Learn more',
    'createStory.title': 'Create your story',
    'createStory.subtitle': 'Open the door to the story in your heart — every manuscript begins a new world.',
    'createStory.eyebrow': 'New manuscript',
    'createStory.storyTitle': 'Story title *',
    'createStory.storyTitlePlaceholder': 'e.g. ప్రేమ కథ or type prema katha',
    'createStory.contentType': 'Content type *',
    'createStory.primaryGenre': 'Primary genre *',
    'createStory.secondaryGenres': 'Secondary genres (up to 3)',
    'createStory.ageRating': 'Age rating *',
    'createStory.language': 'Language *',
    'createStory.completionStatus': 'Completion status',
    'createStory.setting': 'Setting',
    'createStory.settingPlaceholder': 'e.g. Hyderabad, 1990s village',
    'createStory.themes': 'Themes (comma-separated)',
    'createStory.themesPlaceholder': 'family, identity, revenge',
    'createStory.communityTags': 'Community tags',
    'createStory.tagSearchPlaceholder': 'Search tags…',
    'createStory.description': 'Description',
    'createStory.descriptionPlaceholder': 'A brief hook for readers browsing stories…',
    'createStory.releaseSchedule': 'Release schedule',
    'createStory.coverImage': 'Cover image *',
    'createStory.coverHint': 'Required before your story goes live. 600×900 (2:3), JPG/PNG under 1MB.',
    'createStory.coverPlaceholder': '600×900 (2:3) recommended',
    'createStory.coverUpload': 'Click to upload cover',
    'createStory.submit': 'Create Story & Write Chapter 1',
    'createStory.submitting': 'Creating…',
    'createStory.coverRequired': 'Cover image is required before publishing your story.',
    'createStory.moodTagsHint': 'Mood tags',
    'createStory.requestTag': 'Request new tag',
    'createStory.wizardSteps': 'Story creation steps',
    'createStory.stepIdentity': 'Identity',
    'createStory.stepFormat': 'Format',
    'createStory.stepPublish': 'Publish',
    'createStory.essentials': 'Essentials',
    'createStory.advancedDetails': 'More details (optional)',
    'createStory.sidecardTitle': 'Your story — your pride',
    'createStory.sidecardText': 'Real stories for Telugu readers. Your Debut Season journey begins after chapter 1.',
    'createStory.submitHint': 'Cover + title required — then the scene editor opens.',
    'stories.prideTitle': 'Your stories — your identity',
    'stories.prideText': 'Every manuscript is your craft. Write another chapter, share with pride.',
    'notifications.eyebrow': 'Alerts',
    'notifications.title': 'Notifications',
    'notifications.subtitle': 'Review, publishing, and moderation — triage in one place.',
    'notifications.marking': 'Marking…',
    'notifications.markAll': 'Mark all read',
    'notifications.filterAll': 'All',
    'notifications.filterReview': 'Review',
    'notifications.filterPublish': 'Publish',
    'notifications.filterModeration': 'Moderation',
    'notifications.emptyTitle': 'No alerts in this filter',
    'notifications.emptyText': 'Review invitations and moderation updates appear here.',
    'notifications.open': 'Open',
    'moderation.eyebrow': 'Trust & safety',
    'moderation.title': 'Moderation queue',
    'moderation.subtitle': 'Review flagged chapters — clear decisions, respectful messaging.',
    'moderation.filterLabel': 'Filter queue',
    'moderation.filterPending': 'Pending only',
    'moderation.filterAll': 'All items',
    'moderation.refresh': 'Refresh',
    'moderation.loading': 'Loading queue…',
    'moderation.emptyTitle': 'Queue is clear',
    'moderation.emptyText': 'No chapters pending review. Great job!',
    'moderation.pending': 'Pending',
    'moderation.toxicity': 'Toxicity',
    'moderation.chapter': 'Ch',
    'moderation.untitled': 'Untitled',
    'moderation.notesLabel': 'Reviewer notes (optional)',
    'moderation.notesPlaceholder': 'Reason for decision — visible to creator on appeal',
    'moderation.approve': 'Approve',
    'moderation.requestEdits': 'Request edits',
    'moderation.reject': 'Reject',
    'moderation.prevPage': 'Previous',
    'moderation.nextPage': 'Next',
    'moderation.page': 'Page',
    'stories.title': 'My Stories',
    'stories.subtitle': 'Drafts, serialized chapters, and reader stats — all in one place.',
    'stories.eyebrow': 'Manuscript library',
    'stories.newStory': 'New story',
    'stories.empty': 'No stories yet. Create your first one!',
    'stories.draft': 'Draft',
    'stories.ongoing': 'Ongoing',
    'stories.completed': 'Completed',
    'stories.chapters': 'Chapters',
    'stories.readers': 'Readers',
    'stories.lastUpdated': 'Last updated',
    'stories.manage': 'Manage',
    'stories.write': 'Write',
    'stories.searchPlaceholder': 'Search by title or phonetic (e.g. prema katha)…',
    'stories.filterStatus': 'Filter by status',
    'stories.allStatuses': 'All statuses',
    'stories.statusPublished': 'Published',
    'stories.statusPendingReview': 'Pending review',
    'stories.statusNeedsRevision': 'Needs revision',
    'stories.noMatchTitle': 'No manuscripts match',
    'stories.noMatchText': 'Try a different search term or clear the filter.',
    'stories.clearFilters': 'Clear filters',
    'stories.loading': 'Opening your library…',
    'stories.emptyShelfTitle': 'Your shelf is waiting',
    'stories.emptyShelfTe': 'మీ గ్రంథాలయం మొదటి కథ కోసం సిద్ధంగా ఉంది',
    'stories.emptyShelfText': 'Every great Telugu story starts with a single chapter. Create yours today — readers are waiting to walk through the door you open.',
    'stories.createFirst': 'Create your first story',
    'stories.openManuscript': 'Open manuscript',
    'stories.continueWriting': 'Continue',
    'stories.analytics': 'Analytics',
    'stories.archiveConfirm': 'Archive this story? Chapters will be hidden from readers.',
    'shareModal.title': 'Share link',
    'shareModal.selectChapter': 'Select chapter',
    'shareModal.copyLink': 'Copy link',
    'shareModal.freeHint': 'Non-subscribers can read the first 10 chapters free.',
    'shareModal.linkLabel': 'Share link',
    'events.title': 'Events & Contests',
    'events.subtitle': 'Your Debut Season journey — a 50-chapter serialized arc, recognition rewards, and Telugu literary prestige.',
    'events.eyebrow': 'Creator Events',
    'events.hostEvent': 'Host an event',
    'events.openEvents': 'Open events',
    'events.myEvents': 'My events',
    'events.register': 'Register',
    'events.registered': 'Registered',
    'events.submit': 'Submit',
    'events.prizePool': 'Prize pool',
    'events.freeEntry': 'Free entry',
    'events.paidEntry': 'Paid entry',
    'events.deadline': 'Deadline',
    'events.join': 'Join',
    'events.viewEvent': 'View event',
    'events.viewRegistration': 'View registration',
    'events.upcomingClosed': 'Upcoming & closed',
    'events.emptyTitle': 'No events yet',
    'events.emptyText': 'Check back when platform contests open, or join the Debut Season journey.',
    'events.debutHeroTitle': 'Katha Debut Season',
    'events.debutHeroSubtitle': 'Your first serialized arc — a 50-chapter journey. Recognition, badges, and certificates — not cash prizes.',
    'events.debutJourney': 'Author journey',
    'events.debutEvaluation': 'Evaluation dimensions',
    'events.debutProgress': 'Your debut progress',
    'events.debutChapters': 'chapters',
    'events.hostPrivilege': 'Hosting events is an elite privilege — top-25 ranked authors, reviewers, or Katha founders only.',
    'events.registeredCount': 'registered',
    'events.recognitionPrizes': 'Recognition rewards',
    'events.resultsDate': 'Results announcement (tentative)',
    'events.selectStory': 'Choose from your library',
    'events.eligibilityBlocked': 'This story does not meet contest eligibility',
    'events.createTitle': 'Create event',
    'events.createSubtitle': 'Launch a community program — free entry, recognition-focused rewards.',
    'events.publishOpen': 'Publish & open registration',
    'events.wizardEyebrow': 'Event wizard',
    'events.wizardStepsLabel': 'Event creation steps',
    'events.wizardStepBasic': 'Basic information',
    'events.wizardStepEligibility': 'Eligibility',
    'events.wizardStepRegistration': 'Registration',
    'events.wizardStepPrizes': 'Recognition rewards',
    'events.wizardStepJudging': 'Judging model',
    'events.wizardStepTimeline': 'Timeline',
    'events.wizardStepPublishing': 'Publishing',
    'events.eventTitle': 'Event title',
    'events.description': 'Description',
    'events.eventType': 'Event type',
    'events.titlePlaceholder': 'e.g. Katha Debut Season — Vasanta',
    'events.descriptionPlaceholder': 'A brief description visible to creators…',
    'events.eligibilityDesc': 'Telugu language, serialized story format, draft or ongoing status — Debut Season eligibility rules.',
    'events.registrationDesc': 'All Katha events use free registration — no cash entry fees.',
    'events.timelineDesc': 'Timeline: registration → submissions → evaluation → results announcement. Set dates after publishing.',
    'events.publishingDesc': 'Publishing opens registration immediately. Recognition rewards only — badges, certificates, and features.',
    'events.judgingModel': 'Judging model',
    'events.openingRegistration': 'Opening registration…',
    'events.titleRequired': 'Add an event title before publishing.',
    'events.hostBlockedTitle': 'Elite host privilege',
    'events.eventDetails': 'Event details',
    'events.type': 'Type',
    'events.status': 'Status',
    'events.judging': 'Judging',
    'events.entry': 'Entry',
    'events.submissions': 'Submissions',
    'events.evaluationRubric': 'Evaluation rubric',
    'events.registrationCloses': 'Registration closes',
    'events.submissionsClose': 'Submissions close',
    'events.debutSeasonEyebrow': 'Debut Season · Recognition rewards',
    'events.creativeContest': 'Creative contest',
    'events.freeRegistrationHint': 'Free entry — recognition badges and certificates only.',
    'events.submittedStory': 'Submitted',
    'events.registrationClosed': 'Registration closed for this event.',
    'events.registrationComplete': 'Registered — submit your manuscript when ready.',
    'events.alreadyRegistered': 'You are already registered for this event.',
    'events.registering': 'Registering…',
    'events.submitting': 'Submitting…',
    'events.noStories': 'No stories yet.',
    'events.createManuscript': 'Create a manuscript',
    'events.chooseStoryError': 'Choose a story from your library',
    'events.submittedFor': 'Submitted for evaluation',
    'events.debutSeasonBadge': 'Debut Season',
    'events.dimension': 'Dimension',
    'events.weight': 'Weight',
    'events.debutArcChapters': 'Debut arc chapters',
    'events.debutSeasonFree': 'Debut Season · Free',
    'events.journeyRegister': 'Register',
    'events.journeyWrite': 'Write',
    'events.journeySubmit': 'Submit',
    'events.journeyEvaluate': 'Evaluate',
    'events.journeyRecognition': 'Recognition',
    'events.rulesTitle': 'Competition rules',
    'events.rulesEligibility': 'Eligibility',
    'events.rulesJudging': 'Judging',
    'events.rulesPrizes': 'Prizes',
    'events.rulesTimeline': 'Timeline',
    'events.rulesAccept': 'I have read and agree to the competition rules',
    'events.rulesMustAccept': 'Accept the competition rules before registering',
    'events.rulesVersion': 'Rules version',
    'events.rulesRecognitionOnly': 'Recognition rewards only — no cash prizes',
    'events.rulesNoCash': 'No cash prizes',
    'events.statusRegistrationOpen': 'Registration open',
    'events.statusSubmissionsOpen': 'Submissions open',
    'events.statusPublished': 'Published',
    'events.statusJudging': 'Judging in progress',
    'events.statusCompleted': 'Completed',
    'events.statusDraft': 'Draft',
    'events.statusCancelled': 'Cancelled',
    'publishing.title': 'Release operations',
    'publishing.subtitle': 'From drafts to live chapters — your publishing hub.',
    'publishing.eyebrow': 'ప్రచురణ కేంద్రం · Publishing Center',
    'publishing.encouragement': 'Your story world is growing. Every chapter is another step toward your readers — schedule, track, and celebrate each release.',
    'publishing.scheduleRelease': 'Schedule release',
    'publishing.overview': 'Overview',
    'publishing.releaseQueue': 'Release queue',
    'publishing.readerFeedback': 'Reader feedback',
    'publishing.drafts': 'Drafts',
    'publishing.scheduled': 'Scheduled',
    'publishing.published': 'Published',
    'publishing.publishNow': 'Publish now',
    'publishing.scheduleFor': 'Schedule for',
    'publishing.moderation': 'Moderation',
    'publishing.moderationPending': 'Moderation pending',
    'publishing.moderationApproved': 'Approved',
    'publishing.moderationRejected': 'Rejected',
    'publishing.loading': 'Loading publishing data…',
    'publishing.statStories': 'Stories',
    'publishing.statScheduled': 'Scheduled',
    'publishing.statInReview': 'In review',
    'publishing.statPublishedLive': 'Published live',
    'publishing.statStoriesHint': 'Active manuscripts in your studio',
    'publishing.statScheduledHint': 'Upcoming auto-publish slots',
    'publishing.statInReviewHint': 'Chapters awaiting editorial action',
    'publishing.statPublishedHint': 'Chapters currently live for readers',
    'publishing.postPublishHealth': 'Post-publish health',
    'publishing.leadsWith': 'leads with',
    'publishing.readersAcross': 'readers across',
    'publishing.openAnalytics': 'Open story analytics',
    'publishing.scheduledReleases': 'Scheduled releases',
    'publishing.noScheduledLink': 'No scheduled releases.',
    'publishing.publishedContent': 'Published content',
    'publishing.noPublished': 'No published chapters yet. Submit and pass moderation from the chapter editor.',
    'publishing.viewChapter': 'View chapter',
    'publishing.analytics': 'Analytics',
    'publishing.noFeedback': 'Publish a story to start receiving reader feedback.',
    'publishing.noQueue': 'No chapters in moderation. Submit from the chapter editor when ready.',
    'publishing.openEditor': 'Open editor',
    'publishing.live': 'Live',
    'publishing.statusDraft': 'Draft',
    'publishing.statusNeedsEdits': 'Needs edits',
    'publishing.tabsLabel': 'Publishing sections',
    'analytics.backToChapters': 'Back to chapters',
    'analytics.backToPublishing': 'Back to publishing',
    'media.eyebrow': 'మీడియా లైబ్రరీ · Media Library',
    'media.subtitle': 'Cover images, illustrations, and reference assets — keep your publishing pipeline visually ready. Add credit and license for every image.',
    'media.uploadAsset': 'Upload asset',
    'media.attribution': 'Attribution (artist, source)',
    'media.license': 'License (e.g. CC BY 4.0)',
    'media.uploadImage': 'Upload image',
    'media.assets': 'Assets',
    'media.empty': 'No media yet — upload covers and illustrations for your publishing pipeline.',
    'storyBible.eyebrow': 'కథా బైబిల్ · Story Bible',
    'storyBible.subtitle': 'Characters, world, and team — the canonical record of your story. Coordinate with co-authors here.',
    'storyBible.characters': 'Characters',
    'storyBible.world': 'World & lore',
    'storyBible.team': 'Team & tasks',
    'storyBible.addCharacter': 'Add character',
    'storyBible.addEntry': 'Add entry',
    'storyBible.addTask': 'Add task',
    'storyBible.taskPlaceholder': 'Collaboration task (e.g. review chapter 3)',
    'storyBible.assignee': 'Assignee',
    'storyBible.unassigned': 'Unassigned',
    'storyBible.backToChapters': 'Back to chapters',
    'manuscript.eyebrow': 'గ్రంధం · Manuscript',
    'manuscript.subtitle': 'Your chapter bookshelf — write, refine, and publish with confidence.',
    'manuscript.bookshelf': 'Chapter bookshelf',
    'manuscript.addChapter': 'Add chapter',
    'manuscript.backToLibrary': 'Back to library',
    'manuscript.storyBible': 'Story Bible',
    'manuscript.media': 'Media',
    'schedule.title': 'Publishing calendar',
    'schedule.subtitle': 'Choose when a chapter goes live — it publishes automatically even when you are offline.',
    'schedule.eyebrow': 'ప్రచురణ క్యాలెండర్ · Publishing Calendar',
    'schedule.formTitle': 'Schedule a publish',
    'schedule.formLead': 'Story, chapter, date — plan your release in three steps.',
    'schedule.story': 'Story',
    'schedule.chapter': 'Chapter',
    'schedule.publishAt': 'Publish date & time',
    'schedule.confirm': 'Confirm schedule',
    'schedule.confirming': 'Confirming…',
    'schedule.formNote': 'Your chapter goes live at the time you choose. Reschedule or cancel anytime before then.',
    'schedule.calendar': 'Calendar',
    'schedule.upcoming': 'Upcoming releases',
    'schedule.weekly': 'Every week',
    'schedule.biweekly': 'Every other week',
    'schedule.irregular': 'When ready',
    'schedule.complete': 'Story complete',
    'schedule.noScheduled': 'No scheduled chapters',
    'schedule.addChapter': 'Add chapter',
    'schedule.emptyStories': 'Nothing to schedule yet. Create your first manuscript.',
    'schedule.prevMonth': 'Previous month',
    'schedule.nextMonth': 'Next month',
    'schedule.alreadyScheduled': 'already scheduled',
    'schedule.cancelConfirm': 'Cancel scheduled publish for',
    'schedule.newPublishTime': 'New publish time',
    'schedule.weekdaySun': 'Sun',
    'schedule.weekdayMon': 'Mon',
    'schedule.weekdayTue': 'Tue',
    'schedule.weekdayWed': 'Wed',
    'schedule.weekdayThu': 'Thu',
    'schedule.weekdayFri': 'Fri',
    'schedule.weekdaySat': 'Sat',
    'community.title': 'Your reader community',
    'community.subtitle': 'Connect with readers on Katha — messages, reactions, and warmth around your craft.',
    'community.eyebrow': 'పాఠక సమాజం · Reader Community',
    'community.heroTitle': 'Your audience is growing',
    'community.heroSubtitle': 'Share on Katha first — reader love, messages, and reactions live here. WhatsApp and Instagram come after.',
    'community.kathaFirst': 'Share on Katha first',
    'community.kathaFirstHint': 'Rich previews, chapter follows, and in-app bonds — stronger than external social alone.',
    'community.shareInKatha': 'Share a chapter on Katha',
    'community.feedTitle': 'Community feed',
    'community.feedPlaceholder': 'Reader messages, chapter reactions, and weekly warmth will appear here as your stories go live.',
    'community.externalLater': 'WhatsApp & Instagram — after you share on Katha first',
    'community.tags': 'Tags',
    'community.discussions': 'Discussions',
    'community.feedback': 'Feedback',
    'community.requestTag': 'Request new tag',
    'community.members': 'Members',
    'community.composerLabel': 'Post to community',
    'community.composerPlaceholder': 'What do you want to share with readers? Post on Katha first…',
    'community.attachStory': 'Choose story',
    'community.attachChapter': 'Chapter',
    'community.createStoryFirst': 'Create a story first',
    'community.postToFeed': 'Post to feed',
    'community.feedEmptyTitle': 'Your community feed is ready',
    'community.chapter': 'Chapter',
    'community.love': 'Love',
    'community.signalLetters': 'Reader letters',
    'community.signalReactions': 'Chapter reactions',
    'community.signalWarmth': 'Weekly warmth',
    'community.chapterShort': 'Ch',
    'login.continueGoogle': 'Continue with Google',
    'login.continueEmail': 'Continue with email',
    'login.emailLabel': 'Email address',
    'login.emailPlaceholder': 'you@example.com',
    'login.sendCode': 'Send verification code',
    'login.sending': 'Sending…',
    'login.back': 'Back',
    'login.penName': 'Pen name (optional)',
    'login.penNamePlaceholder': 'How readers see you',
    'login.otpLabel': '6-digit code',
    'login.otpPlaceholder': '• • • • • •',
    'login.sentTo': 'Sent to',
    'login.enterStudio': 'Enter your studio',
    'login.verifying': 'Verifying…',
    'login.resend': 'Resend code',
    'login.resendIn': 'Resend in',
    'login.changeEmail': 'Change email',
    'login.mockMode': 'MOCK MODE · Email OTP = 123456',
    'onboarding.welcome': 'Welcome to Creator Studio',
    'onboarding.progress': 'complete',
    'onboarding.step1Title': 'Create your account',
    'onboarding.step1Desc': 'Sign in with Google or email — free to start, always.',
    'onboarding.step2Title': 'Start your first manuscript',
    'onboarding.step2Desc': 'Title, genre, cover, and release rhythm — the bones of a great story.',
    'onboarding.step3Title': 'Write chapter 1',
    'onboarding.step3Desc': 'Scene-based editor with live preview. Up to 50,000 characters of pure craft.',
    'onboarding.step4Title': 'Publish & share with pride',
    'onboarding.step4Desc': 'Chapters go live after a careful review (usually 1–2 hours).',
    'onboarding.beginManuscript': 'Begin your first manuscript',
    'onboarding.skipDashboard': 'Skip to dashboard',
    'onboarding.whatsappSubtitle': 'Get creator resources and open a free WhatsApp support window',
    'monetization.eyebrow': 'Literary patronage · Story Trust',
    'monetization.title': 'Literary patronage & Story Trust',
    'monetization.subtitle': 'Katha is a publishing ecosystem — not a social platform. We reward sustained reader value, enable literary patronage, and recognize achievement.',
    'monetization.charter': 'Brand charter',
    'monetization.trustLadder': 'Story Trust ladder',
    'monetization.trustLead': 'Only Performing and above are monetization eligible.',
    'monetization.eligible': 'Monetization unlocked',
    'monetization.path': 'Path to monetization',
    'monetization.spi': 'Story Performance Index',
    'monetization.spiLead': 'Never rely on a single metric — SPI blends reader signals holistically.',
    'monetization.revenue': 'Revenue model',
    'monetization.patronage': 'Literary patronage',
    'monetization.launchFlow': 'First story launch',
    'monetization.shortStory': 'Short story economy',
    'monetization.vocabulary': 'Katha vocabulary',
    'monetization.surfaces': 'Monetization surfaces',
    'monetization.avoid': 'Avoid',
    'monetization.preferred': 'Preferred',
    'settings.eyebrow': 'Studio preferences',
    'settings.title': 'Settings',
    'settings.subtitle': 'Account, appearance, and local data — tuned for long writing sessions.',
    'settings.profile': 'Creator profile',
    'settings.payout': 'Payout readiness',
    'settings.payoutLead': 'Quarterly Story Trust payouts require a verified UPI ID and legal name matching your tax records.',
    'settings.legalName': 'Legal name (as on UPI / PAN)',
    'settings.upi': 'UPI ID',
    'settings.taxId': 'PAN / tax ID (optional until first payout)',
    'settings.savePayout': 'Save payout details',
    'settings.saving': 'Saving…',
    'settings.appearance': 'Appearance',
    'settings.comfort': 'Eye comfort',
    'settings.devices': 'Devices',
    'settings.cache': 'Local cache',
    'settings.labs': 'Studio labs',
    'settings.signOut': 'Sign out',
    'profile.eyebrow': 'Author identity',
    'profile.title': 'Your profile',
    'profile.subtitle': 'Your public identity — keep it proud, polished, and up to date.',
    'profile.penName': 'Pen name',
    'profile.tagline': 'Tagline',
    'profile.genres': 'Favorite genres',
    'profile.save': 'Save profile',
    'profile.saved': 'Saved',
    'profile.totalReads': 'Total reads',
    'profile.storyTrust': 'Story Trust share',
    'profile.stories': 'Stories',
    'profile.nextLevel': 'Next level',
    'reviewers.navReview': 'Review',
    'reviewers.navRequest': 'Request',
    'reviewers.navPool': 'Pool',
    'reviewers.navAdmin': 'Admin',
    'reviewers.waiting': 'waiting',
    'reviewers.dashboard': 'Dashboard',
    'reviewers.toRead': 'to read',
    'reviewers.active': 'active',
    'reviewers.getFeedback': 'Get feedback',
    'reviewers.browseJoin': 'Browse & join',
    'championship.eyebrow': 'Global Championship',
    'championship.title': 'Katha Global Championship',
    'championship.subtitle': 'Elite cross-league tournament for Debut Laureates and Premier League winners.',
    'championship.league': "Authors' Premier League",
    'championship.magazine': 'Premium Magazine',
    'championship.requiresDebut': 'Requires Debut Author badge',
    'championship.comingPhase': 'Opens when Premier Leagues go live',
    'dashboard.debutEyebrow': 'Debut Season',
    'dashboard.debutTitle': 'Your first novel — the prestige path',
    'dashboard.debutHint': 'Complete 50 chapters to earn the Debut Author badge — then monetization and contests unlock.',
    'dashboard.debutCta': 'View Debut Season',
    'dashboard.debutEnroll': 'Auto-enrolled when your first story is published.',
    'dashboard.debutGradEyebrow': 'Debut Season complete',
    'dashboard.debutGradTitle': 'Congratulations — you are a Debut Author!',
    'dashboard.debutGradTe': 'మీ 50 అధ్యాయాల ప్రయాణం పూర్తయింది',
    'dashboard.debutGradBody': 'Your first serialized arc is complete. Claim your badge and share the pride with readers.',
    'dashboard.debutGradShare': 'Share your badge',
    'dashboard.debutGradCopy': 'Copy link',
    'dashboard.debutGradCta': 'Continue',
    'dashboard.chapters': 'chapters',
    'dashboard.metricsReads': 'Total reads',
    'dashboard.metricsSubs': 'Active subscribers',
    'dashboard.metricsEarnings': 'Earnings this month',
    'dashboard.metricsTrust': 'Story Trust share',
    'dashboard.demoBanner': 'Demo metrics — live data appears after you publish on Supabase.',
    'stats.writingStreak': 'day lamp lit',
    'stats.badge': 'Badge',
    'stats.storyTrust': 'Story Trust',
    'stats.teluguCraft': 'Telugu craft',
  },
};

export function getStudioStrings(locale: StudioLocale): StudioStrings {
  return STRINGS[locale];
}

export function t(locale: StudioLocale, key: StudioStringKey): string {
  return STRINGS[locale][key];
}