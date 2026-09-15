// Game state
let language = "ar";
let currentStationIndex = 0;
let safetyScore = 100;
let trustScore = 100;
let answeredCorrectly = 0;

let player = {
  name: "",
  department: "",
  role: ""
};

// Game stations with questions
const stations = [
  {
    name: "Reception",
    emoji: "🏁",
    question: "What is the first step when a patient arrives at the hospital?",
    questionAr: "ما أول خطوة عند وصول المريض للمستشفى؟",
    answers: [
      { text: "Verify patient identity and check-in", textAr: "التحقق من هوية المريض والتسجيل", correct: true },
      { text: "Send them directly to the ward", textAr: "إرساله مباشرة للقسم", correct: false },
      { text: "Take blood samples immediately", textAr: "أخذ عينات دم فوراً", correct: false },
      { text: "Give medication immediately", textAr: "إعطاء الدواء فوراً", correct: false }
    ]
  },
  {
    name: "Outpatient Clinic",
    emoji: "⚕️",
    question: "What should a doctor do before prescribing medication?",
    questionAr: "ماذا يجب على الطبيب أن يفعل قبل وصف الدواء؟",
    answers: [
      { text: "Take a complete medical history", textAr: "أخذ التاريخ الطبي الكامل", correct: true },
      { text: "Prescribe without checking", textAr: "وصف الدواء دون فحص", correct: false },
      { text: "Ask the patient's age only", textAr: "السؤال عن العمر فقط", correct: false },
      { text: "Use the same medication for everyone", textAr: "استخدام نفس الدواء للجميع", correct: false }
    ]
  },
  {
    name: "Laboratory",
    emoji: "🧪",
    question: "What is crucial for accurate laboratory results?",
    questionAr: "ما الذي يجب التأكد منه لنتائج دقيقة في المختبر؟",
    answers: [
      { text: "Proper sample labeling and handling", textAr: "وضع العلامات المناسبة على العينة", correct: true },
      { text: "Speed over accuracy", textAr: "السرعة على حساب الدقة", correct: false },
      { text: "Mixing samples from different patients", textAr: "خلط العينات من مرضى مختلفين", correct: false },
      { text: "Ignoring expiration dates", textAr: "تجاهل تواريخ الانتهاء", correct: false }
    ]
  },
  {
    name: "Radiology",
    emoji: "🩻",
    question: "What should be done before X-ray procedures?",
    questionAr: "ما الذي يجب فعله قبل إجراء صور الأشعة؟",
    answers: [
      { text: "Verify patient ID and check for contraindications", textAr: "التحقق من هوية المريض والتحقق من الموانع", correct: true },
      { text: "Expose without protection", textAr: "التعرض للأشعة بدون حماية", correct: false },
      { text: "Repeat scans unnecessarily", textAr: "تكرار الفحوصات غير الضرورية", correct: false },
      { text: "Ignore pregnancy warnings", textAr: "تجاهل تحذيرات الحمل", correct: false }
    ]
  },
  {
    name: "Pharmacy",
    emoji: "💊",
    question: "What is critical in pharmacy operations?",
    questionAr: "ما الذي يجب التركيز عليه في الصيدلية؟",
    answers: [
      { text: "Check drug interactions and allergies", textAr: "التحقق من التفاعلات والحساسيات", correct: true },
      { text: "Dispense without verification", textAr: "صرف الدواء بدون تحقق", correct: false },
      { text: "Mix different medications randomly", textAr: "خلط الأدوية عشوائياً", correct: false },
      { text: "Ignore storage conditions", textAr: "تجاهل شروط التخزين", correct: false }
    ]
  },
  {
    name: "Admission",
    emoji: "📝",
    question: "What is essential during patient admission?",
    questionAr: "ما الضروري أثناء قبول المريض؟",
    answers: [
      { text: "Complete documentation and consent forms", textAr: "التوثيق الكامل والموافقات", correct: true },
      { text: "Skip paperwork to save time", textAr: "تخطي الأوراق لتوفير الوقت", correct: false },
      { text: "Don't inform about procedures", textAr: "عدم إبلاغ المريض بالإجراءات", correct: false },
      { text: "Ignore patient preferences", textAr: "تجاهل تفضيلات المريض", correct: false }
    ]
  },
  {
    name: "Ward",
    emoji: "🛏️",
    question: "What is the priority in patient ward care?",
    questionAr: "ما هي الأولوية في رعاية المريض بالقسم؟",
    answers: [
      { text: "Regular monitoring and timely medication", textAr: "المراقبة المنتظمة والأدوية في الوقت المحدد", correct: true },
      { text: "Minimize check-ins to save time", textAr: "تقليل الفحوصات لتوفير الوقت", correct: false },
      { text: "Ignore vital signs", textAr: "تجاهل العلامات الحيوية", correct: false },
      { text: "Delay medication administration", textAr: "تأخير الأدوية", correct: false }
    ]
  },
  {
    name: "Nutrition",
    emoji: "🍽️",
    question: "What should nutrition staff consider?",
    questionAr: "ما الذي يجب على موظفي التغذية أن يراعوه؟",
    answers: [
      { text: "Patient dietary restrictions and allergies", textAr: "القيود الغذائية والحساسيات", correct: true },
      { text: "Serve any food without checking", textAr: "تقديم أي طعام بدون فحص", correct: false },
      { text: "Ignore medical dietary needs", textAr: "تجاهل احتياجات النظام الغذائي", correct: false },
      { text: "Use expired ingredients", textAr: "استخدام مكونات منتهية الصلاحية", correct: false }
    ]
  },
  {
    name: "Housekeeping",
    emoji: "🧹",
    question: "Why is hospital cleanliness important?",
    questionAr: "لماذا تنظيف المستشفى مهم؟",
    answers: [
      { text: "To prevent infections and disease spread", textAr: "لمنع العدوى والأمراض", correct: true },
      { text: "Just for appearance", textAr: "للمظهر فقط", correct: false },
      { text: "Cleaning is not important", textAr: "التنظيف غير مهم", correct: false },
      { text: "Use harsh chemicals without care", textAr: "استخدام مواد كيميائية قاسية", correct: false }
    ]
  },
  {
    name: "Maintenance",
    emoji: "🔧",
    question: "What is critical for maintenance staff?",
    questionAr: "ما الذي يجب أن يركز عليه موظفو الصيانة؟",
    answers: [
      { text: "Regular equipment maintenance and safety checks", textAr: "صيانة دورية وفحوصات الأمان", correct: true },
      { text: "Ignore equipment problems", textAr: "تجاهل مشاكل المعدات", correct: false },
      { text: "Skip safety protocols", textAr: "تخطي بروتوكولات الأمان", correct: false },
      { text: "Use unsafe tools and methods", textAr: "استخدام أدوات غير آمنة", correct: false }
    ]
  },
  {
    name: "Discharge",
    emoji: "🏠",
    question: "What should be included in discharge planning?",
    questionAr: "ما الذي يجب تضمينه في خطة الخروج؟",
    answers: [
      { text: "Clear instructions and follow-up appointments", textAr: "تعليمات واضحة ومواعيد المتابعة", correct: true },
      { text: "Send patient home without instructions", textAr: "إرسال المريض بدون تعليمات", correct: false },
      { text: "No follow-up care needed", textAr: "لا توجد متابعة ضرورية", correct: false },
      { text: "Avoid counseling and education", textAr: "تجنب الاستشارة والتثقيف", correct: false }
    ]
  }
];

// Language translation
const translations = {
  ar: {
    mainTitle: "🏥 رحلة المريض الآمنة",
    subTitle: "اليوم العالمي لسلامة المرضى 2026",
    missionText: "ساعد عم سمير على إكمال رحلة آمنة داخل المستشفى",
    regTitle: "بيانات اللاعب",
    nameLabel: "الاسم",
    deptLabel: "القسم",
    roleLabel: "الدور الوظيفي",
    startBtn: "دخول اللعبة",
    patientName: "عم سمير",
    safetyLabel: "درجة السلامة",
    trustLabel: "ثقة المريض",
    journeyTitle: "🏥 رحلة عم سمير",
    gameOverTitle: "تم إكمال اللعبة!",
    finalMessage: "شكراً لك على مساعدتك لعم سمير على إكمال رحلة آمنة!",
    correctAnswer: "✓ إجابة صحيحة! ممتاز!",
    incorrectAnswer: "✗ إجابة خاطئة. تقليل الثقة والسلامة"
  },
  en: {
    mainTitle: "🏥 Safe Patient Journey",
    subTitle: "World Patient Safety Day 2026",
    missionText: "Help Mr. Samir complete a safe journey through the hospital.",
    regTitle: "Player Information",
    nameLabel: "Name",
    deptLabel: "Department",
    roleLabel: "Role",
    startBtn: "Start Game",
    patientName: "Mr. Samir",
    safetyLabel: "Patient Safety Score",
    trustLabel: "Patient Trust",
    journeyTitle: "🏥 Mr. Samir's Journey",
    gameOverTitle: "Game Complete!",
    finalMessage: "Thank you for helping Mr. Samir complete a safe hospital journey!",
    correctAnswer: "✓ Correct! Excellent!",
    incorrectAnswer: "✗ Incorrect. Safety and trust decreased"
  }
};

/**
 * Set the game language
 */
function setLanguage(lang) {
  language = lang;
  
  if (lang === "en") {
    document.documentElement.dir = "ltr";
  } else {
    document.documentElement.dir = "rtl";
  }

  // Update all text elements
  const trans = translations[lang];
  document.getElementById("mainTitle").innerHTML = trans.mainTitle;
  document.getElementById("subTitle").innerHTML = trans.subTitle;
  document.getElementById("missionText").innerHTML = trans.missionText;
  
  if (document.getElementById("regTitle")) {
    document.getElementById("regTitle").innerHTML = trans.regTitle;
    document.getElementById("nameLabel").innerHTML = trans.nameLabel;
    document.getElementById("deptLabel").innerHTML = trans.deptLabel;
    document.getElementById("roleLabel").innerHTML = trans.roleLabel;
    document.getElementById("startBtn").innerHTML = trans.startBtn;
  }

  if (document.getElementById("patientName")) {
    document.getElementById("patientName").innerHTML = trans.patientName;
    document.getElementById("safetyLabel").innerHTML = trans.safetyLabel;
    document.getElementById("trustLabel").innerHTML = trans.trustLabel;
    document.getElementById("journeyTitle").innerHTML = trans.journeyTitle;
  }

  if (document.getElementById("gameOverTitle")) {
    document.getElementById("gameOverTitle").innerHTML = trans.gameOverTitle;
    document.getElementById("finalMessage").innerHTML = trans.finalMessage;
  }
}

/**
 * Show registration screen
 */
function showRegistration() {
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("registrationScreen").classList.remove("hidden");
}

/**
 * Start the game
 */
function startGame() {
  player.name = document.getElementById("playerName").value;
  player.department = document.getElementById("department").value;
  player.role = document.getElementById("role").value;

  if (!player.name || !player.department) {
    alert(language === "ar" ? "الرجاء ملء جميع الحقول" : "Please fill all fields");
    return;
  }

  localStorage.setItem("playerName", player.name);
  localStorage.setItem("playerRole", player.role);

  document.getElementById("registrationScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  initializeStations();
  loadStation(0);
}

/**
 * Initialize all stations on the map
 */
function initializeStations() {
  const stationMap = document.getElementById("stationMap");
  stationMap.innerHTML = "";
  
  stations.forEach((station, index) => {
    const stationDiv = document.createElement("div");
    stationDiv.className = "station";
    stationDiv.id = `station-${index}`;
    stationDiv.innerHTML = `${station.emoji} ${station.name}`;
    stationMap.appendChild(stationDiv);
  });
}

/**
 * Load a specific station
 */
function loadStation(index) {
  currentStationIndex = index;
  const station = stations[index];

  // Update station highlighting
  document.querySelectorAll(".station").forEach((s, i) => {
    s.classList.remove("active", "completed");
    if (i < index) s.classList.add("completed");
    if (i === index) s.classList.add("active");
  });

  // Update title
  const stationTitle = language === "ar" ? `المحطة: ${station.name}` : `Station: ${station.name}`;
  document.getElementById("currentStation").innerHTML = stationTitle;
  document.getElementById("questionText").innerHTML = language === "ar" ? station.questionAr : station.question;

  // Clear previous answers and feedback
  document.getElementById("answers").innerHTML = "";
  document.getElementById("feedback").innerHTML = "";

  // Load answers
  const answersDiv = document.getElementById("answers");
  station.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.innerHTML = language === "ar" ? answer.textAr : answer.text;
    button.onclick = () => checkAnswer(answer.correct, button);
    answersDiv.appendChild(button);
  });

  // Update progress bars
  updateBars();
}

/**
 * Check the player's answer
 */
function checkAnswer(correct, buttonElement) {
  const allButtons = document.querySelectorAll("#answers button");
  allButtons.forEach(btn => btn.disabled = true);

  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.classList.remove("correct", "incorrect");

  const trans = translations[language];

  if (correct) {
    buttonElement.classList.add("correct");
    feedbackDiv.classList.add("correct");
    feedbackDiv.innerHTML = trans.correctAnswer;
    answeredCorrectly++;
  } else {
    buttonElement.classList.add("incorrect");
    feedbackDiv.classList.add("incorrect");
    feedbackDiv.innerHTML = trans.incorrectAnswer;
    safetyScore -= 10;
    trustScore -= 10;
  }

  updateBars();

  // Move to next station or end game
  setTimeout(() => {
    if (currentStationIndex < stations.length - 1) {
      loadStation(currentStationIndex + 1);
    } else {
      endGame();
    }
  }, 2000);
}

/**
 * Update progress bars
 */
function updateBars() {
  const safetyPercent = Math.max(0, safetyScore);
  const trustPercent = Math.max(0, trustScore);

  document.getElementById("safetyBar").style.width = safetyPercent + "%";
  document.getElementById("safetyValue").innerHTML = safetyPercent;

  document.getElementById("trustBar").style.width = trustPercent + "%";
  document.getElementById("trustValue").innerHTML = trustPercent + "%";
}

/**
 * End the game and show results
 */
function endGame() {
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.remove("hidden");

  const finalScore = Math.round((answeredCorrectly / stations.length) * 100);
  document.getElementById("finalScore").innerHTML = finalScore + "%";
  document.getElementById("playerInfo").innerHTML = `<strong>${player.name}</strong> - ${player.role} at ${player.department}`;
}

// Initialize with Arabic on page load
window.addEventListener('DOMContentLoaded', () => {
  setLanguage("ar");
});
