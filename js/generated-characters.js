(function () {
  const assets = {
    Doctor: {
      character: 'assets/characters/Doctor.webp.png',
      scene: 'assets/backgrounds/doctor-scene.webp.png',
      header: 'assets/ui/doctor-header.webp.png'
    },
    Nurse: {
      character: 'assets/characters/Nurse.webp.png',
      scene: 'assets/backgrounds/nurse-scene.webp.png',
      header: 'assets/ui/nurse-header.webp.png'
    },
    Pharmacist: {
      character: 'assets/characters/Pharmacist.webp.png',
      scene: 'assets/backgrounds/pharmacy-scene.webp.png',
      header: 'assets/ui/pharmacy-header.webp.png'
    },
    Kitchen: {
      character: 'assets/characters/dietition.webp.png',
      scene: 'assets/backgrounds/kitchen-scene.webp.png',
      header: 'assets/ui/kitchen-header.webp.png'
    },
    Housekeeping: {
      character: 'assets/characters/housekeeping.webp.png',
      scene: 'assets/backgrounds/housekeeping-scene.webp.png',
      header: 'assets/ui/housekeeping-header.webp.png'
    },
    Maintenance: {
      character: 'assets/characters/maintenance.webp.png',
      scene: 'assets/backgrounds/maintenance-scene.webp.png',
      header: 'assets/ui/maintenance-header.webp.png'
    },
    Administration: {
      character: 'assets/characters/administration.webp.png',
      scene: 'assets/backgrounds/administration-scene.webp.png',
      header: 'assets/ui/administration-header.webp.png'
    },
    WHOChallenges: {
      character: 'assets/characters/Final all team.webp.png',
      scene: 'assets/backgrounds/final-scene.webp.png',
      header: 'assets/ui/final-header.webp.png'
    }
  };

  const patientAssets = {
    attentive: 'assets/characters/Attentive patient.webp.png',
    thinking: 'assets/characters/thinking patient.webp.png',
    correct: 'assets/characters/Happy Patient.webp.png',
    incorrect: 'assets/characters/incorrect answer reaction patient.webp.png'
  };

  function currentKey() {
    return isWHOChallenge ? 'WHOChallenges' : selectedRole;
  }

  function setPatientState(state) {
    const patient = document.getElementById('generatedPatientArt');
    if (!patient) return;
    patient.src = patientAssets[state] || patientAssets.attentive;
    patient.dataset.state = state;
  }

  function syncArt(patientState) {
    const key = currentKey();
    const station = assets[key] || assets.Doctor;
    const staff = document.getElementById('generatedStaffArt');
    const patient = document.getElementById('generatedPatientArt');
    const stage = document.querySelector('.game-stage');
    const gameScreen = document.getElementById('gameScreen');
    const heading = document.querySelector('.station-heading');

    if (staff) {
      staff.src = station.character;
      staff.alt = key === 'WHOChallenges' ? 'Patient safety team' : key + ' team member';
    }

    if (patient) {
      patient.hidden = false;
      setPatientState(key === 'WHOChallenges' ? 'correct' : (patientState || 'thinking'));
    }

    if (gameScreen) gameScreen.setAttribute('data-role-art', key.toLowerCase());
    if (stage) stage.style.setProperty('--scene-image', 'url("' + station.scene + '")');
    if (heading) heading.style.setProperty('--header-image', 'url("' + station.header + '")');
  }

  const oldLoad = window.loadQuestion;
  window.loadQuestion = function () {
    oldLoad.apply(this, arguments);
    syncArt('thinking');
  };

  const oldStart = window.startGame;
  window.startGame = function () {
    oldStart.apply(this, arguments);
    syncArt('attentive');
  };

  const oldCheck = window.checkAnswer;
  window.checkAnswer = function (correct) {
    const result = oldCheck.apply(this, arguments);
    setPatientState(correct ? 'correct' : 'incorrect');
    return result;
  };

  const oldEnd = window.endGame;
  window.endGame = function () {
    oldEnd.apply(this, arguments);
    const final = document.getElementById('finalTeamArt');
    if (final) final.src = assets.WHOChallenges.character;
    const finalPatient = document.getElementById('finalPatientArt');
    if (finalPatient) finalPatient.src = patientAssets.correct;
  };
  const introTranslations = {
    en: {
      brand: 'World Patient Safety Day',
      year: '2026 EDITION',
      kicker: 'Patient Safety Learning Experience',
      title: 'Safer care starts with you.',
      subtitle: 'Choose wisely. Protect every patient.',
      mission: 'Step into realistic healthcare scenarios, make safety-critical decisions, and discover how every role contributes to safer care.',
      roles: 'Healthcare roles',
      real: 'Real',
      scenarios: 'Safety scenarios',
      missionStat: 'Shared mission',
      start: 'Start the journey',
      think: 'Think safely',
      decision: 'Every decision matters',
      care: 'Care together',
      goal: 'One team, one goal',
      learn: 'Learn',
      decide: 'Decide',
      protect: 'Protect',
      tagline: 'Different roles. Same goal. Safer patients.',
      host: 'Open the live host screen ↗'
    },
    ar: {
      brand: 'اليوم العالمي لسلامة المرضى',
      year: 'نسخة 2026',
      kicker: 'تجربة تعليمية لسلامة المرضى',
      title: 'رعاية أكثر أماناً تبدأ بك.',
      subtitle: 'اختر بحكمة. احمِ كل مريض.',
      mission: 'عِش مواقف واقعية من بيئة الرعاية الصحية، واتخذ قرارات مهمة للسلامة، واكتشف كيف يساهم كل دور في تقديم رعاية أكثر أماناً.',
      roles: 'أدوار في الرعاية الصحية',
      real: 'واقعية',
      scenarios: 'مواقف سلامة',
      missionStat: 'مهمة مشتركة',
      start: 'ابدأ الرحلة',
      think: 'فكّر بأمان',
      decision: 'كل قرار يصنع فرقاً',
      care: 'نتعاون في الرعاية',
      goal: 'فريق واحد، هدف واحد',
      learn: 'تعلّم',
      decide: 'قرّر',
      protect: 'احمِ',
      tagline: 'أدوار مختلفة. هدف واحد. مرضى أكثر أماناً.',
      host: 'افتح شاشة العرض المباشر ↗'
    }
  };

  function translateIntro(lang) {
    const copy = introTranslations[lang] || introTranslations.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-intro]').forEach(function (element) {
      const key = element.getAttribute('data-intro');
      if (copy[key]) element.textContent = copy[key];
    });
    const title = document.getElementById('mainTitle');
    const subtitle = document.getElementById('subTitle');
    const mission = document.getElementById('missionText');
    const host = document.getElementById('hostLinkText');
    if (title) title.textContent = copy.title;
    if (subtitle) subtitle.textContent = copy.subtitle;
    if (mission) mission.textContent = copy.mission;
    if (host) host.textContent = copy.host;
  }

  const oldSetLanguage = window.setLanguage;
  window.setLanguage = function (lang) {
    oldSetLanguage.apply(this, arguments);
    translateIntro(lang);
  };

  translateIntro(typeof language === 'string' ? language : 'ar');

})();