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
    const heading = document.querySelector('.station-heading');

    if (staff) {
      staff.src = station.character;
      staff.alt = key === 'WHOChallenges' ? 'Patient safety team' : key + ' team member';
    }

    if (patient) {
      patient.hidden = key === 'WHOChallenges';
      if (key !== 'WHOChallenges') setPatientState(patientState || 'thinking');
    }

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
  };
})();