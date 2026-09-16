// Game state
let language = "ar";
let currentQuestionIndex = 0;
let safetyScore = 100;
let trustScore = 100;
let answeredCorrectly = 0;
let selectedRole = null;
let isWHOChallenge = false;

let player = {
  role: ""
};

/**
 * Live scoreboard (Firebase Realtime Database)
 * Each browser tab/session gets its own id so the host screen can list every
 * player independently and update their scores live as the game progresses.
 */
function getLiveSessionId() {
  let id = sessionStorage.getItem("psd_session_id");
  if (!id) {
    id = "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem("psd_session_id", id);
  }
  return id;
}

const liveSessionId = getLiveSessionId();

/**
 * Push the player's current progress to Firebase so the live host screen can
 * display it. Fails silently (logs a warning) if Firebase isn't reachable.
 */
function pushLiveScore(status, extra) {
  if (typeof firebaseDb === "undefined" || !firebaseDb) return;

  const totalRoleQuestions = (questions[selectedRole] || []).length;
  const totalQuestions = totalRoleQuestions + (questions["WHOChallenges"] || []).length;

  const payload = Object.assign({
    role: player.role || "",
    safetyScore: Math.max(0, safetyScore),
    trustScore: Math.max(0, trustScore),
    answeredCorrectly,
    totalQuestions,
    status: status || "playing",
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }, extra || {});

  firebaseDb.ref("players/" + liveSessionId).update(payload).catch(err => {
    console.warn("Live score update failed", err);
  });
}

/**
 * Comprehensive question database organized by role
 */
const questions = {
  Doctor: [
    {
      station: "Clinic",
      question: "نسي عم سمير قائمة أدويته الحالية. ما أفضل إجراء؟",
      options: ["مراجعة الملف الطبي المتاح", "مراجعة جميع الأدوية الحالية مع المريض وأسرته", "سؤال المريض عن الأدوية التي يتذكرها"],
      correct: 1,
      explanation: "Medication Reconciliation أفضل ممارسة لسلامة المريض.",
      voice: "من فضلك راجع جميع أدويتي.",
      question_en: "Uncle Samir forgot his current medication list. What is the best action?",
      options_en: ["Review the available medical file", "Reconcile all current medications with the patient and family", "Ask the patient about medications he remembers"],
      explanation_en: "Medication Reconciliation is the best practice for patient safety.",
      voice_en: "Please review all my medications."
    },
    {
      station: "Consultation",
      question: "المريض لا يفهم التشخيص.",
      options: ["تزويد المريض بمواد تثقيفية", "شرح الحالة بلغة بسيطة والتأكد من فهمه", "تحديد موعد متابعة لمناقشة الحالة"],
      correct: 1,
      explanation: "إشراك المريض يبدأ بالفهم.",
      voice: "من فضلك اشرح حالتي.",
      question_en: "The patient doesn't understand the diagnosis.",
      options_en: ["Provide the patient with educational materials", "Explain the condition in simple language and confirm understanding", "Schedule a follow-up appointment to discuss the case"],
      explanation_en: "Patient engagement starts with understanding.",
      voice_en: "Please explain my condition."
    }
  ],
  Nurse: [
    {
      station: "Ward",
      question: "المريض يشعر بالدوخة عند الوقوف.",
      options: ["تذكير المريض بطلب المساعدة", "تقييم خطر السقوط وتطبيق الوقاية", "إبلاغ الطبيب"],
      correct: 1,
      explanation: "تقييم خطر السقوط هو الإجراء الأكثر أماناً.",
      voice: "أخشى السقوط.",
      question_en: "The patient feels dizzy when standing.",
      options_en: ["Remind the patient to ask for help", "Assess fall risk and apply fall prevention measures", "Inform the doctor"],
      explanation_en: "Fall risk assessment is the safest action.",
      voice_en: "I'm afraid of falling."
    }
  ],
  Pharmacist: [
    {
      station: "Pharmacy",
      question: "قبل صرف الدواء.",
      options: ["مراجعة الوصفة", "التحقق من الهوية باستخدام معرفين", "مراجعة السجل الدوائي"],
      correct: 1,
      explanation: "التحقق من الهوية يمنع الأخطاء الدوائية.",
      voice: "هذا دوائي؟",
      question_en: "Before dispensing medication.",
      options_en: ["Review the prescription", "Verify identity using two identifiers", "Review the medication record"],
      explanation_en: "Identity verification prevents medication errors.",
      voice_en: "Is this my medication?"
    }
  ],
  Kitchen: [
    {
      station: "Nutrition",
      question: "مريض السكري طلب وجبة إضافية.",
      options: ["مراجعة احتياجاته الغذائية", "توفير خيار يتوافق مع الخطة الغذائية العلاجية", "التنسيق مع التمريض بشأن الطلب"],
      correct: 1,
      explanation: "الخطة الغذائية العلاجية يجب أن تدعم السيطرة على المرض المزمن.",
      voice: "ساعدوني في اختيار الطعام المناسب.",
      question_en: "A diabetic patient requested an extra meal.",
      options_en: ["Review his nutritional needs", "Provide an option that complies with the therapeutic diet plan", "Coordinate with nursing regarding the request"],
      explanation_en: "The therapeutic diet plan must support chronic disease control.",
      voice_en: "Help me choose the right food."
    },
    {
      station: "Nutrition",
      question: "يوجد تحسس غذائي موثق للمريض.",
      options: ["مراجعة مكونات الوجبة", "التأكد من خلو الوجبة من المادة المسببة للتحسس", "مراجعة تفضيلات المريض الغذائية"],
      correct: 1,
      explanation: "منع التعرض لمسببات الحساسية يقلل المخاطر بشكل كبير.",
      voice: "لدي حساسية غذائية.",
      question_en: "The patient has a documented food allergy.",
      options_en: ["Review the meal ingredients", "Ensure the meal is free of the allergen", "Review the patient's food preferences"],
      explanation_en: "Preventing allergen exposure significantly reduces risk.",
      voice_en: "I have a food allergy."
    },
    {
      station: "Nutrition",
      question: "وصلت وجبة إلى مريض مختلف.",
      options: ["مراجعة رقم الغرفة", "مطابقة هوية المريض قبل تسليم الوجبة", "الرجوع إلى قائمة الوجبات"],
      correct: 1,
      explanation: "مطابقة هوية المريض تمنع الأخطاء الغذائية.",
      voice: "أريد الوجبة المخصصة لي.",
      question_en: "A meal arrived for a different patient.",
      options_en: ["Check the room number", "Verify patient identity before delivering the meal", "Refer to the meal list"],
      explanation_en: "Verifying patient identity prevents nutrition errors.",
      voice_en: "I want my designated meal."
    },
    {
      station: "Nutrition",
      question: "درجة حرارة الطعام غير مناسبة.",
      options: ["تقييم صلاحية الوجبة", "استبدال الوجبة وفق متطلبات سلامة الغذاء", "التواصل مع قسم التغذية"],
      correct: 1,
      explanation: "سلامة الغذاء تشمل تقديم الطعام بدرجة حرارة مناسبة.",
      voice: "أريد طعاماً آمناً.",
      question_en: "The food temperature is inappropriate.",
      options_en: ["Assess the meal's suitability", "Replace the meal according to food safety requirements", "Contact the nutrition department"],
      explanation_en: "Food safety includes serving food at the appropriate temperature.",
      voice_en: "I want safe food."
    },
    {
      station: "Nutrition",
      question: "المريض يعاني من صعوبة البلع.",
      options: ["متابعة استهلاك الوجبة", "إبلاغ الفريق المعالج وتعديل الخطة الغذائية", "مراجعة تفضيلات الطعام"],
      correct: 1,
      explanation: "صعوبة البلع تزيد خطر الاختناق والشفط الرئوي.",
      voice: "الأكل أصبح صعباً.",
      question_en: "The patient has difficulty swallowing.",
      options_en: ["Continue monitoring meal consumption", "Inform the care team and adjust the diet plan", "Review food preferences"],
      explanation_en: "Swallowing difficulty increases the risk of choking and aspiration.",
      voice_en: "Eating has become difficult."
    },
    {
      station: "Nutrition",
      question: "المريض لا يتناول كامل وجبته.",
      options: ["تسجيل كمية الطعام المستهلكة", "مناقشة الأسباب مع المريض وتعديل الخطة الغذائية", "طلب تقييم غذائي إضافي"],
      correct: 1,
      explanation: "فهم السبب يساعد في تحسين الحالة الغذائية.",
      voice: "لا أستطيع إنهاء وجبتي.",
      question_en: "The patient is not eating the full meal.",
      options_en: ["Record the amount of food consumed", "Discuss the reasons with the patient and adjust the diet plan", "Request an additional nutritional assessment"],
      explanation_en: "Understanding the cause helps improve nutritional status.",
      voice_en: "I can't finish my meal."
    },
    {
      station: "Nutrition",
      question: "المريض يريد إحضار طعام من المنزل.",
      options: ["مراجعة نوع الطعام", "تقييم توافق الطعام مع الخطة العلاجية", "توثيق الطلب"],
      correct: 1,
      explanation: "يجب التأكد من أن الطعام يدعم الخطة العلاجية.",
      voice: "أفضل بعض الأطعمة من المنزل.",
      question_en: "The patient wants to bring food from home.",
      options_en: ["Review the type of food", "Assess the food's compatibility with the treatment plan", "Document the request"],
      explanation_en: "It must be ensured that the food supports the treatment plan.",
      voice_en: "I'd prefer some food from home."
    },
    {
      station: "Nutrition",
      question: "المريض يعاني من ضعف الشهية.",
      options: ["تسجيل الملاحظة", "إشراك أخصائي التغذية والمريض في الخطة الغذائية", "زيادة عدد الوجبات"],
      correct: 1,
      explanation: "التعاون مع المريض يحسن فرص الالتزام بالخطة.",
      voice: "لا أشعر برغبة كبيرة في الطعام.",
      question_en: "The patient has poor appetite.",
      options_en: ["Record the observation", "Involve the dietitian and patient in the diet plan", "Increase the number of meals"],
      explanation_en: "Collaborating with the patient improves adherence to the plan.",
      voice_en: "I don't feel like eating much."
    },
    {
      station: "Nutrition",
      question: "تم تعديل الخطة الغذائية.",
      options: ["إرسال الخطة للمريض", "شرح التعديل للمريض والتأكد من فهمه", "توثيق التعديل"],
      correct: 1,
      explanation: "فهم المريض للخطة جزء من الرعاية المتمركزة حوله.",
      voice: "أريد معرفة سبب تغيير النظام الغذائي.",
      question_en: "The diet plan has been modified.",
      options_en: ["Send the plan to the patient", "Explain the modification to the patient and confirm understanding", "Document the modification"],
      explanation_en: "The patient's understanding of the plan is part of patient-centered care.",
      voice_en: "I want to know why my diet was changed."
    },
    {
      station: "Nutrition",
      question: "المريض يستعد للخروج من المستشفى.",
      options: ["تسليم تعليمات مكتوبة", "مراجعة التعليمات الغذائية وخطة المتابعة معه", "إعطاؤه موعداً للمتابعة"],
      correct: 1,
      explanation: "استمرار الرعاية بعد الخروج مهم لمرضى الأمراض المزمنة.",
      voice: "كيف أستمر على النظام الغذائي في المنزل؟",
      question_en: "The patient is preparing for hospital discharge.",
      options_en: ["Hand over written instructions", "Review the dietary instructions and follow-up plan with him", "Give him a follow-up appointment"],
      explanation_en: "Continuity of care after discharge is important for chronic disease patients.",
      voice_en: "How do I continue the diet at home?"
    }
  ],
  Housekeeping: [
    {
      station: "Housekeeping",
      question: "انسكب سائل في ممر المرضى.",
      options: ["إبلاغ المشرف", "تأمين المنطقة وتنظيفها ووضع علامة تحذيرية", "جدولة التنظيف ضمن الأعمال الحالية"],
      correct: 1,
      explanation: "التدخل الفوري يقلل خطر السقوط.",
      voice: "أريد بيئة آمنة.",
      question_en: "Liquid spilled in the patient corridor.",
      options_en: ["Inform the supervisor", "Secure the area, clean it, and place a warning sign", "Schedule cleaning within current tasks"],
      explanation_en: "Immediate intervention reduces the risk of falls.",
      voice_en: "I want a safe environment."
    },
    {
      station: "Housekeeping",
      question: "سلة النفايات الطبية ممتلئة.",
      options: ["متابعة مستوى الامتلاء", "استبدالها وفق السياسة المعتمدة", "إبلاغ القسم المعني"],
      correct: 1,
      explanation: "إدارة النفايات بشكل صحيح جزء من سلامة المرضى.",
      voice: "حافظوا على البيئة آمنة.",
      question_en: "The medical waste bin is full.",
      options_en: ["Monitor the fill level", "Replace it according to approved policy", "Inform the relevant department"],
      explanation_en: "Proper waste management is part of patient safety.",
      voice_en: "Keep the environment safe."
    },
    {
      station: "Housekeeping",
      question: "بعد الانتهاء من تنظيف غرفة مريض.",
      options: ["إزالة معدات التنظيف", "تطبيق نظافة اليدين وفق السياسة", "تجهيز المعدات للمهمة التالية"],
      correct: 1,
      explanation: "نظافة اليدين تقلل انتقال العدوى.",
      voice: "احموني من العدوى.",
      question_en: "After finishing cleaning a patient's room.",
      options_en: ["Remove cleaning equipment", "Perform hand hygiene according to policy", "Prepare equipment for the next task"],
      explanation_en: "Hand hygiene reduces infection transmission.",
      voice_en: "Protect me from infection."
    },
    {
      station: "Housekeeping",
      question: "يتم تنظيف غرفة تحت احتياطات العزل.",
      options: ["مراجعة خطة التنظيف", "تطبيق احتياطات العزل أثناء التنظيف", "التنسيق مع الفريق"],
      correct: 1,
      explanation: "العزل يمنع انتقال العدوى داخل المستشفى.",
      voice: "أحتاج إلى حماية إضافية.",
      question_en: "A room is being cleaned under isolation precautions.",
      options_en: ["Review the cleaning plan", "Apply isolation precautions while cleaning", "Coordinate with the team"],
      explanation_en: "Isolation prevents infection transmission within the hospital.",
      voice_en: "I need extra protection."
    },
    {
      station: "Housekeeping",
      question: "تُستخدم أدوات تنظيف في عدة مناطق.",
      options: ["فحص حالة الأدوات", "منع التلوث المتبادل بين المناطق", "تنظيم المعدات بالمستودع"],
      correct: 1,
      explanation: "منع انتقال الملوثات بين المناطق ضروري.",
      voice: "أريد غرفة نظيفة وآمنة.",
      question_en: "Cleaning tools are used in multiple areas.",
      options_en: ["Check the condition of the tools", "Prevent cross-contamination between areas", "Organize equipment in storage"],
      explanation_en: "Preventing contaminant transfer between areas is essential.",
      voice_en: "I want a clean and safe room."
    },
    {
      station: "Housekeeping",
      question: "أبلغ مريض عن منطقة زلقة.",
      options: ["تسجيل البلاغ", "تقييم الخطر ومعالجته فوراً", "مراجعة خطة التنظيف"],
      correct: 1,
      explanation: "إزالة الخطر بسرعة تمنع الحوادث.",
      voice: "الممر غير آمن.",
      question_en: "A patient reported a slippery area.",
      options_en: ["Record the report", "Assess the risk and address it immediately", "Review the cleaning plan"],
      explanation_en: "Quickly removing the hazard prevents accidents.",
      voice_en: "The corridor isn't safe."
    },
    {
      station: "Housekeeping",
      question: "اكتشاف خطر بيئي داخل القسم.",
      options: ["إبلاغ الإدارة", "الاستجابة الفورية وتقليل الخطر", "تسجيل ملاحظة بالموقع"],
      correct: 1,
      explanation: "سلامة البيئة جزء من سلامة الرعاية.",
      voice: "أحتاج إلى بيئة آمنة.",
      question_en: "An environmental hazard was discovered in the department.",
      options_en: ["Inform management", "Respond immediately and reduce the risk", "Record a note at the location"],
      explanation_en: "Environmental safety is part of care safety.",
      voice_en: "I need a safe environment."
    },
    {
      station: "Housekeeping",
      question: "غرفة عالية الخطورة بحاجة للتنظيف.",
      options: ["بدء التنظيف", "التحقق من اكتمال التنظيف والتطهير حسب السياسة", "تغيير مواد التنظيف"],
      correct: 1,
      explanation: "المناطق عالية الخطورة تتطلب تحققاً إضافياً.",
      voice: "أتوقع بيئة آمنة ونظيفة.",
      question_en: "A high-risk room needs cleaning.",
      options_en: ["Start cleaning", "Verify that cleaning and disinfection are complete per policy", "Change the cleaning materials"],
      explanation_en: "High-risk areas require additional verification.",
      voice_en: "I expect a safe and clean environment."
    },
    {
      station: "Housekeeping",
      question: "معدات تنظيف ملوثة.",
      options: ["تنظيفها لاحقاً", "عزلها واستبدالها وفق السياسة", "تسجيل الملاحظة"],
      correct: 1,
      explanation: "استخدام أدوات ملوثة قد ينقل العدوى.",
      voice: "حافظوا على نظافة المكان.",
      question_en: "Cleaning equipment is contaminated.",
      options_en: ["Clean it later", "Isolate and replace it according to policy", "Record the observation"],
      explanation_en: "Using contaminated tools may transmit infection.",
      voice_en: "Keep the place clean."
    },
    {
      station: "Housekeeping",
      question: "خطر متكرر في نفس الموقع.",
      options: ["إبلاغ المشرف فقط", "الإبلاغ والمشاركة في إجراءات التحسين", "متابعة الملاحظة مستقبلاً"],
      correct: 1,
      explanation: "التحسين المستمر يمنع تكرار الحوادث.",
      voice: "لا أريد تكرار المشكلة.",
      question_en: "A recurring hazard at the same location.",
      options_en: ["Report to the supervisor only", "Report and participate in improvement actions", "Monitor the observation in the future"],
      explanation_en: "Continuous improvement prevents recurring incidents.",
      voice_en: "I don't want the problem to repeat."
    }
  ],
  Maintenance: [
    {
      station: "Maintenance",
      question: "يوجد سلك كهربائي مكشوف بالممر.",
      options: ["إبلاغ قسم الصيانة", "تأمين الخطر ومعالجة المشكلة فوراً", "إدراجه ضمن خطة العمل"],
      correct: 1,
      explanation: "إزالة الخطر الفوري تحمي المرضى والموظفين.",
      voice: "أريد ممراً آمناً.",
      question_en: "An exposed electrical wire is in the corridor.",
      options_en: ["Inform the maintenance department", "Secure the hazard and address the issue immediately", "Add it to the work plan"],
      explanation_en: "Immediate hazard removal protects patients and staff.",
      voice_en: "I want a safe corridor."
    },
    {
      station: "Maintenance",
      question: "فرامل سرير المريض لا تعمل.",
      options: ["تقييم حالة السرير", "إصلاح السرير أو استبداله قبل الاستخدام", "متابعة البلاغ مع القسم"],
      correct: 1,
      explanation: "سرير غير آمن قد يؤدي إلى سقوط المريض.",
      voice: "سريري يجب أن يكون آمناً.",
      question_en: "The patient's bed brakes are not working.",
      options_en: ["Assess the bed's condition", "Repair or replace the bed before use", "Follow up the report with the department"],
      explanation_en: "An unsafe bed may lead to patient falls.",
      voice_en: "My bed should be safe."
    },
    {
      station: "Maintenance",
      question: "تم اكتشاف خلل في إنذار الحريق.",
      options: ["جدولة الإصلاح", "إعادة النظام للعمل بأسرع وقت", "مراجعة سجل الصيانة"],
      correct: 1,
      explanation: "أنظمة الإنذار ضرورية للاستجابة للطوارئ.",
      voice: "أريد مستشفى آمنة.",
      question_en: "A fault was discovered in the fire alarm.",
      options_en: ["Schedule the repair", "Restore the system to operation as quickly as possible", "Review the maintenance log"],
      explanation_en: "Alarm systems are essential for emergency response.",
      voice_en: "I want a safe hospital."
    },
    {
      station: "Maintenance",
      question: "الأرضية غير مستوية بمنطقة المرضى.",
      options: ["تقييم المشكلة", "معالجة الخطر لمنع التعثر والسقوط", "مراجعة خطة الصيانة"],
      correct: 1,
      explanation: "منع السقوط من أولويات سلامة المرضى.",
      voice: "أحتاج إلى ممر آمن.",
      question_en: "The floor is uneven in the patient area.",
      options_en: ["Assess the issue", "Address the hazard to prevent trips and falls", "Review the maintenance plan"],
      explanation_en: "Fall prevention is a patient safety priority.",
      voice_en: "I need a safe walkway."
    },
    {
      station: "Maintenance",
      question: "وصل موعد الصيانة الوقائية لجهاز طبي.",
      options: ["مراجعة أداء الجهاز", "تنفيذ الصيانة الوقائية حسب الجدول", "التنسيق مع المستخدمين"],
      correct: 1,
      explanation: "الصيانة الوقائية تقلل الأعطال المفاجئة.",
      voice: "أعتمد على الأجهزة بأمان.",
      question_en: "Preventive maintenance for a medical device is due.",
      options_en: ["Review the device's performance", "Perform preventive maintenance as scheduled", "Coordinate with users"],
      explanation_en: "Preventive maintenance reduces sudden failures.",
      voice_en: "I rely on the equipment being safe."
    },
    {
      station: "Maintenance",
      question: "زر طلب المساعدة لا يعمل.",
      options: ["مراجعة البلاغ", "إصلاح النظام فوراً لضمان إمكانية الاستخدام", "جدولة زيارة فنية"],
      correct: 1,
      explanation: "وسائل طلب المساعدة عنصر حيوي لسلامة المريض.",
      voice: "قد أحتاج المساعدة في أي لحظة.",
      question_en: "The call button is not working.",
      options_en: ["Review the report", "Fix the system immediately to ensure it can be used", "Schedule a technical visit"],
      explanation_en: "Call for help systems are vital to patient safety.",
      voice_en: "I may need help at any moment."
    },
    {
      station: "Maintenance",
      question: "عطل متكرر في جهاز طبي.",
      options: ["إصلاح العطل الحالي", "تحليل السبب الجذري واتخاذ إجراء دائم", "متابعة أداء الجهاز"],
      correct: 1,
      explanation: "تحليل السبب الجذري يمنع تكرار المشكلة.",
      voice: "أحتاج أجهزة موثوقة.",
      question_en: "A recurring fault in a medical device.",
      options_en: ["Fix the current fault", "Analyze the root cause and take permanent action", "Continue monitoring the device's performance"],
      explanation_en: "Root cause analysis prevents the problem from recurring.",
      voice_en: "I need reliable equipment."
    },
    {
      station: "Maintenance",
      question: "حدث عطل في المصعد المستخدم لنقل المرضى.",
      options: ["إغلاق المصعد", "إدارة الخطر وتأمين بديل آمن للمرضى", "تسجيل البلاغ"],
      correct: 1,
      explanation: "استمرارية الخدمة مهمة لسلامة المرضى.",
      voice: "أحتاج التنقل بأمان.",
      question_en: "A fault occurred in the elevator used to transport patients.",
      options_en: ["Shut down the elevator", "Manage the risk and secure a safe alternative for patients", "Record the report"],
      explanation_en: "Service continuity is important for patient safety.",
      voice_en: "I need to move safely."
    },
    {
      station: "Maintenance",
      question: "إضاءة الممرات غير كافية.",
      options: ["فحص النظام", "إصلاح الإضاءة لمنع الحوادث", "إبلاغ الإدارة"],
      correct: 1,
      explanation: "الرؤية الواضحة تقلل خطر السقوط.",
      voice: "الإضاءة تساعدني على الحركة بأمان.",
      question_en: "Corridor lighting is insufficient.",
      options_en: ["Inspect the system", "Fix the lighting to prevent accidents", "Inform management"],
      explanation_en: "Clear visibility reduces fall risk.",
      voice_en: "Lighting helps me move safely."
    },
    {
      station: "Maintenance",
      question: "تم الانتهاء من صيانة جهاز طبي.",
      options: ["إغلاق البلاغ", "التأكد من سلامة الجهاز قبل إعادته للاستخدام", "إبلاغ القسم"],
      correct: 1,
      explanation: "التحقق بعد الصيانة جزء من السلامة.",
      voice: "أريد جهازاً آمناً وموثوقاً.",
      question_en: "Maintenance of a medical device has been completed.",
      options_en: ["Close the report", "Confirm the device's safety before returning it to use", "Inform the department"],
      explanation_en: "Post-maintenance verification is part of safety.",
      voice_en: "I want a safe and reliable device."
    }
  ],
  Administration: [
    {
      station: "Registration",
      question: "وصول المريض للتسجيل.",
      options: ["مراجعة بيانات الموعد", "التحقق من الهوية باستخدام معرفين معتمدين", "مراجعة الملف الطبي السابق"],
      correct: 1,
      explanation: "التعريف الصحيح بالمريض من أهم عناصر سلامة المرضى.",
      voice: "أريد التأكد من أنني المريض الصحيح.",
      question_en: "Patient arrives for registration.",
      options_en: ["Review appointment details", "Verify identity using two approved identifiers", "Review the previous medical file"],
      explanation_en: "Correct patient identification is one of the most important elements of patient safety.",
      voice_en: "I want to make sure I'm the right patient."
    },
    {
      station: "Patient Rights",
      question: "المريض لا يعرف حقوقه أثناء تلقي الرعاية.",
      options: ["تزويده بمعلومات عامة عن المستشفى", "شرح حقوق المرضى وطرق الحصول على الدعم", "توجيهه إلى مكتب علاقات المرضى"],
      correct: 1,
      explanation: "معرفة الحقوق تعزز مشاركة المريض في الرعاية.",
      voice: "أريد معرفة حقوقي داخل المستشفى.",
      question_en: "The patient doesn't know their rights while receiving care.",
      options_en: ["Provide general information about the hospital", "Explain patient rights and how to get support", "Direct him to the patient relations office"],
      explanation_en: "Knowing one's rights enhances patient participation in care.",
      voice_en: "I want to know my rights in the hospital."
    },
    {
      station: "Complaint Management",
      question: "تم استلام شكوى تتعلق بسلامة المرضى.",
      options: ["توثيق الشكوى في النظام", "التحقيق في الأسباب واتخاذ إجراءات تحسين", "مشاركة الشكوى مع الإدارة المعنية"],
      correct: 1,
      explanation: "دراسة الشكاوى تساعد على تقليل المخاطر المستقبلية.",
      voice: "أريد أن تؤخذ مخاوفي على محمل الجد.",
      question_en: "A complaint related to patient safety was received.",
      options_en: ["Document the complaint in the system", "Investigate the causes and take improvement actions", "Share the complaint with relevant management"],
      explanation_en: "Studying complaints helps reduce future risks.",
      voice_en: "I want my concerns to be taken seriously."
    },
    {
      station: "Shared Decision",
      question: "المريض يرغب بالمشاركة في القرار العلاجي.",
      options: ["تزويده بالمعلومات اللازمة", "إشراكه وأسرته في مناقشة الخيارات العلاجية", "توثيق رغبته بالمشاركة"],
      correct: 1,
      explanation: "الرعاية المتمركزة حول المريض تعتمد على المشاركة الفعلية.",
      voice: "أريد أن أكون جزءاً من القرار.",
      question_en: "The patient wants to participate in the treatment decision.",
      options_en: ["Provide him with the necessary information", "Involve him and his family in discussing treatment options", "Document his wish to participate"],
      explanation_en: "Patient-centered care relies on genuine participation.",
      voice_en: "I want to be part of the decision."
    },
    {
      station: "Communication",
      question: "المريض يحتاج دعماً لغوياً لفهم الرعاية.",
      options: ["توفير مواد مكتوبة مناسبة", "توفير وسيلة تواصل أو ترجمة فعالة", "التنسيق مع الفريق المسؤول"],
      correct: 1,
      explanation: "التواصل الفعال يقلل مخاطر سوء الفهم.",
      voice: "ساعدوني على فهم الرعاية المقدمة لي.",
      question_en: "The patient needs language support to understand care.",
      options_en: ["Provide appropriate written materials", "Provide effective communication or interpretation", "Coordinate with the responsible team"],
      explanation_en: "Effective communication reduces the risk of misunderstanding.",
      voice_en: "Help me understand the care I'm receiving."
    },
    {
      station: "Test Results",
      question: "يرغب المريض في الاطلاع على نتائج الفحوصات.",
      options: ["تزويده بملخص للنتائج", "مراجعة النتائج معه وشرح معناها", "إتاحة نسخة من التقرير"],
      correct: 1,
      explanation: "فهم النتائج يساعد المريض على اتخاذ قرارات أفضل.",
      voice: "أريد أن أفهم نتائج فحوصاتي.",
      question_en: "The patient wants to see the test results.",
      options_en: ["Provide him a summary of the results", "Review the results with him and explain their meaning", "Make a copy of the report available"],
      explanation_en: "Understanding the results helps the patient make better decisions.",
      voice_en: "I want to understand my test results."
    },
    {
      station: "Transfer of Care",
      question: "تم نقل المريض إلى قسم جديد.",
      options: ["تحديث موقع المريض في النظام", "التأكد من اكتمال التواصل ونقل المعلومات للمريض والقسم الجديد", "إرسال إشعار للقسم المستقبل"],
      correct: 1,
      explanation: "استمرارية المعلومات عنصر أساسي لسلامة المرضى.",
      voice: "أريد أن تكون جميع معلوماتي متاحة للفريق الجديد.",
      question_en: "The patient was transferred to a new department.",
      options_en: ["Update the patient's location in the system", "Ensure complete communication and information transfer to the patient and new department", "Send a notification to the receiving department"],
      explanation_en: "Continuity of information is essential for patient safety.",
      voice_en: "I want all my information available to the new team."
    },
    {
      station: "Care Plan",
      question: "طلب المريض نسخة من الخطة العلاجية.",
      options: ["توفير ملخص للخطة", "تسليم نسخة وشرحها للمريض", "توثيق الطلب في الملف"],
      correct: 1,
      explanation: "فهم الخطة العلاجية يزيد الالتزام بالعلاج.",
      voice: "أريد معرفة تفاصيل خطة علاجي.",
      question_en: "The patient requested a copy of the treatment plan.",
      options_en: ["Provide a summary of the plan", "Hand him a copy and explain it", "Document the request in the file"],
      explanation_en: "Understanding the treatment plan increases adherence to treatment.",
      voice_en: "I want to know the details of my treatment plan."
    },
    {
      station: "Follow-up",
      question: "يواجه المريض صعوبة في حجز موعد متابعة.",
      options: ["إبلاغ القسم المختص", "تسهيل الوصول للخدمة المناسبة", "إعطاؤه معلومات الاتصال"],
      correct: 1,
      explanation: "استمرارية الرعاية بعد الخروج عنصر مهم للمرضى المزمنين.",
      voice: "أحتاج للوصول بسهولة إلى الرعاية.",
      question_en: "The patient has difficulty booking a follow-up appointment.",
      options_en: ["Inform the relevant department", "Facilitate access to the appropriate service", "Give him contact information"],
      explanation_en: "Continuity of care after discharge is important for chronic patients.",
      voice_en: "I need easy access to care."
    },
    {
      station: "Coordination",
      question: "المريض يحتاج دعماً إضافياً من أكثر من قسم.",
      options: ["إبلاغ الأقسام المعنية", "تنسيق الرعاية بين الفرق المختلفة", "توثيق الحاجة في الملف"],
      correct: 1,
      explanation: "التنسيق الفعال يضمن رعاية متكاملة.",
      voice: "أحتاج إلى فريق يعمل معي كوحدة واحدة.",
      question_en: "The patient needs extra support from more than one department.",
      options_en: ["Inform the relevant departments", "Coordinate care between the different teams", "Document the need in the file"],
      explanation_en: "Effective coordination ensures integrated care.",
      voice_en: "I need a team that works with me as one unit."
    }
  ],
  WHOChallenges: [
    {
      station: "WHO Gold Challenge",
      question: "ما أفضل مؤشر على أن المريض أصبح شريكاً حقيقياً في الرعاية؟",
      options: ["حضوره لجميع المواعيد", "مشاركته الفعلية في اتخاذ القرارات وفهم الخطة العلاجية", "استلامه مواد تثقيفية مكتوبة"],
      correct: 1,
      explanation: "الشراكة الحقيقية تعني مشاركة فعالة في القرارات المتعلقة بالرعاية.",
      voice: "أريد أن يكون صوتي مسموعاً.",
      question_en: "What is the best indicator that a patient has become a true partner in care?",
      options_en: ["Attending all appointments", "His actual participation in decision-making and understanding the treatment plan", "Receiving written educational materials"],
      explanation_en: "True partnership means actively participating in care-related decisions.",
      voice_en: "I want my voice to be heard."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أهم وسيلة لتقليل الضرر أثناء رحلة المريض داخل المستشفى؟",
      options: ["زيادة استخدام الأنظمة الإلكترونية", "التواصل الفعال وإشراك المريض", "زيادة عدد الإجراءات الرقابية"],
      correct: 1,
      explanation: "التواصل ومشاركة المريض من أكثر العوامل تأثيراً على سلامة المرضى.",
      voice: "أريد أن أفهم ما يحدث لي في كل خطوة.",
      question_en: "What is the most important way to reduce harm during a patient's journey in the hospital?",
      options_en: ["Increasing the use of electronic systems", "Effective communication and patient engagement", "Increasing the number of oversight procedures"],
      explanation_en: "Communication and patient engagement are among the most influential factors in patient safety.",
      voice_en: "I want to understand what's happening to me at every step."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أهم عنصر في انتقال الرعاية الآمن بين الأقسام؟",
      options: ["استخدام نماذج موحدة", "مشاركة المعلومات الأساسية وإشراك المريض", "إرسال الملف الطبي كاملاً"],
      correct: 1,
      explanation: "انتقال المعلومات الصحيحة ومشاركة المريض يقللان الأخطاء.",
      voice: "أريد أن يعرف كل فريق حالتي بشكل صحيح.",
      question_en: "What is the most important element in safe transfer of care between departments?",
      options_en: ["Using standardized forms", "Sharing essential information and engaging the patient", "Sending the complete medical file"],
      explanation_en: "Correct information transfer and patient engagement reduce errors.",
      voice_en: "I want every team to know my condition correctly."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أفضل وسيلة لتحسين نتائج مرضى الأمراض غير السارية؟",
      options: ["زيادة عدد الزيارات الطبية", "إشراك المريض في إدارة حالته الصحية", "تكثيف الفحوصات الدورية"],
      correct: 1,
      explanation: "إدارة المريض لحالته الصحية عنصر محوري في الأمراض المزمنة.",
      voice: "أريد أن أتمكن من إدارة مرضي بثقة.",
      question_en: "What is the best way to improve outcomes for non-communicable disease patients?",
      options_en: ["Increasing the number of medical visits", "Engaging the patient in managing their health condition", "Intensifying periodic tests"],
      explanation_en: "Patients managing their own health condition is a pivotal element in chronic diseases.",
      voice_en: "I want to be able to manage my illness with confidence."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما الرسالة الرئيسية لليوم العالمي لسلامة المرضى؟",
      options: ["التكنولوجيا تحسن جودة الرعاية", "الرعاية الأكثر أماناً تتحقق عندما يكون المريض شريكاً في الرعاية", "زيادة الموارد تقلل الأخطاء"],
      correct: 1,
      explanation: "الشراكة مع المرضى والأسر هي جوهر سلامة المرضى الحديثة.",
      voice: "أنا لست متلقياً للرعاية فقط... أنا شريك في سلامتي.",
      question_en: "What is the main message of World Patient Safety Day?",
      options_en: ["Technology improves the quality of care", "The safest care is achieved when the patient is a partner in care", "Increasing resources reduces errors"],
      explanation_en: "Partnership with patients and families is the essence of modern patient safety.",
      voice_en: "I am not just a recipient of care... I am a partner in my safety."
    }
  ]
};

// Language translations
const translations = {
  ar: {
    mainTitle: "🏥 رحلة المريض الآمنة",
    subTitle: "اليوم العالمي لسلامة المرضى 2026",
    missionText: "ساعد عم سمير على إكمال رحلة آمنة داخل المستشفى",
    regTitle: "بيانات اللاعب",
    roleLabel: "الدور الوظيفي",
    startBtn: "دخول اللعبة",
    enterGameBtn: "ابدأ اللعبة",
    newGameBtn: "لعبة جديدة",
    patientName: "عم سمير",
    safetyLabel: "درجة السلامة",
    trustLabel: "ثقة المريض",
    journeyTitle: "🏥 رحلة عم سمير",
    gameOverTitle: "تم إكمال اللعبة!",
    finalMessage: "شكراً لك على مساعدتك لعم سمير على إكمال رحلة آمنة!",
    correctAnswer: "✓ إجابة صحيحة! ممتاز!",
    incorrectAnswer: "✗ إجابة خاطئة. تقليل الثقة والسلامة",
    whoChallengeTitle: "🏆 تحديات اليوم العالمي لسلامة المرضى",
    whoChallengeMessage: "أكملت أسئلتك بنجاح! الآن حان وقت التحدي النهائي!",
    hostLinkText: "📺 افتح شاشة العرض المباشر"
  },
  en: {
    mainTitle: "🏥 Safe Patient Journey",
    subTitle: "World Patient Safety Day 2026",
    missionText: "Help Mr. Samir complete a safe journey through the hospital.",
    regTitle: "Player Information",
    roleLabel: "Role",
    startBtn: "Start Game",
    enterGameBtn: "Start Game",
    newGameBtn: "New Game",
    patientName: "Mr. Samir",
    safetyLabel: "Patient Safety Score",
    trustLabel: "Patient Trust",
    journeyTitle: "🏥 Mr. Samir's Journey",
    gameOverTitle: "Game Complete!",
    finalMessage: "Thank you for helping Mr. Samir complete a safe hospital journey!",
    correctAnswer: "✓ Correct! Excellent!",
    incorrectAnswer: "✗ Incorrect. Safety and trust decreased",
    whoChallengeTitle: "🏆 World Patient Safety Day Challenges",
    whoChallengeMessage: "You completed your questions successfully! Now it's time for the final challenge!",
    hostLinkText: "📺 Open live host screen"
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

  const trans = translations[lang];
  document.getElementById("mainTitle").innerHTML = trans.mainTitle;
  document.getElementById("subTitle").innerHTML = trans.subTitle;
  document.getElementById("missionText").innerHTML = trans.missionText;

  if (document.getElementById("enterGameBtn")) {
    document.getElementById("enterGameBtn").innerHTML = trans.enterGameBtn;
  }

  if (document.getElementById("newGameBtn")) {
    document.getElementById("newGameBtn").innerHTML = trans.newGameBtn;
  }

  if (document.getElementById("hostLinkText")) {
    document.getElementById("hostLinkText").innerHTML = trans.hostLinkText;
  }
  
  if (document.getElementById("regTitle")) {
    document.getElementById("regTitle").innerHTML = trans.regTitle;
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
  player.role = document.getElementById("role").value;

  if (!player.role) {
    alert(language === "ar" ? "الرجاء اختيار الدور الوظيفي" : "Please select your role");
    return;
  }

  localStorage.setItem("playerRole", player.role);

  document.getElementById("registrationScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  selectedRole = player.role;
  currentQuestionIndex = 0;
  isWHOChallenge = false;
  pushLiveScore("playing");
  loadQuestion();
}

/**
 * Maps each question "station" name to a visual place theme, so the game
 * screen background and the journey map icon can reflect where in the
 * hospital the patient currently is.
 */
const placeThemes = {
  Clinic: "clinic",
  Consultation: "clinic",
  Ward: "ward",
  Pharmacy: "pharmacy",
  Nutrition: "kitchen",
  Housekeeping: "housekeeping",
  Maintenance: "maintenance",
  Registration: "admin",
  "Patient Rights": "admin",
  "Complaint Management": "admin",
  "Shared Decision": "admin",
  Communication: "admin",
  "Test Results": "admin",
  "Transfer of Care": "admin",
  "Care Plan": "admin",
  "Follow-up": "admin",
  Coordination: "admin",
  "WHO Gold Challenge": "who"
};

const placeMeta = {
  clinic: { icon: "🩺" },
  ward: { icon: "🛏️" },
  pharmacy: { icon: "💊" },
  kitchen: { icon: "🍲" },
  housekeeping: { icon: "🧹" },
  maintenance: { icon: "🔧" },
  admin: { icon: "📋" },
  who: { icon: "🌍" }
};

/**
 * Switch the game screen's themed background to match the current station.
 */
function applyPlaceTheme(station) {
  const gameScreen = document.getElementById("gameScreen");
  if (!gameScreen) return;
  const theme = placeThemes[station] || "clinic";
  gameScreen.setAttribute("data-place", theme);
}

/**
 * Render the patient's journey map: one box per unique station visited by
 * the current role, plus the closing WHO Gold Challenge, marking each as
 * completed, active, or upcoming.
 */
function renderStationMap(roleQuestions, question) {
  const mapDiv = document.getElementById("stationMap");
  if (!mapDiv) return;

  const stations = [];
  roleQuestions.forEach(q => {
    if (!stations.includes(q.station)) stations.push(q.station);
  });
  if (!stations.includes("WHO Gold Challenge")) stations.push("WHO Gold Challenge");

  mapDiv.innerHTML = "";
  stations.forEach(stationName => {
    const theme = placeThemes[stationName] || "clinic";
    const box = document.createElement("div");
    box.className = "station";

    const isWhoStation = stationName === "WHO Gold Challenge";
    const roleFinished = currentQuestionIndex >= roleQuestions.length || isWHOChallenge;

    if (isWhoStation) {
      if (isWHOChallenge) {
        box.classList.add("active");
      } else if (roleFinished) {
        box.classList.add("active");
      }
    } else if (isWHOChallenge) {
      box.classList.add("completed");
    } else if (question && question.station === stationName) {
      box.classList.add("active");
    } else {
      const lastIndexForStation = roleQuestions.reduce((acc, q, idx) => (q.station === stationName ? idx : acc), -1);
      if (lastIndexForStation < currentQuestionIndex) box.classList.add("completed");
    }

    box.innerHTML = `<div class="station-icon">${placeMeta[theme].icon}</div><div class="station-label">${stationName}</div>`;
    mapDiv.appendChild(box);
  });
}

/**
 * Load a specific question based on player role
 */
function loadQuestion() {
  const avatarDiv = document.getElementById("avatar");
  if (avatarDiv) avatarDiv.classList.remove("state-correct", "state-incorrect");

  const roleQuestions = isWHOChallenge ? questions["WHOChallenges"] : (questions[selectedRole] || questions["WHOChallenges"]);
  const journeyQuestions = questions[selectedRole] || questions["WHOChallenges"];
  
  if (currentQuestionIndex >= roleQuestions.length) {
    // If we just finished role questions, move to WHO Challenge
    if (!isWHOChallenge) {
      applyPlaceTheme("WHO Gold Challenge");
      renderStationMap(journeyQuestions, null);
      showWHOChallengeIntro();
    } else {
      // If we finished WHO Challenge, end the game
      endGame();
    }
    return;
  }

  const question = roleQuestions[currentQuestionIndex];
  const isEnglish = language === "en";
  const questionTextValue = isEnglish && question.question_en ? question.question_en : question.question;
  const optionsValue = isEnglish && question.options_en ? question.options_en : question.options;
  const explanationValue = isEnglish && question.explanation_en ? question.explanation_en : question.explanation;

  applyPlaceTheme(question.station);
  renderStationMap(journeyQuestions, isWHOChallenge ? null : question);
  pushLiveScore(isWHOChallenge ? "who_challenge" : "playing", { station: question.station });

  document.getElementById("currentStation").innerHTML = language === "ar" ? `المحطة: ${question.station}` : `Station: ${question.station}`;
  document.getElementById("questionText").innerHTML = questionTextValue;

  document.getElementById("answers").innerHTML = "";
  document.getElementById("feedback").innerHTML = "";

  const answersDiv = document.getElementById("answers");
  optionsValue.forEach((option, index) => {
    const button = document.createElement("button");
    button.innerHTML = option;
    button.onclick = () => checkAnswer(index === question.correct, button, explanationValue);
    answersDiv.appendChild(button);
  });

  updateBars();
}

/**
 * Show WHO Challenge introduction
 */
function showWHOChallengeIntro() {
  const trans = translations[language];
  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.classList.add("correct");
  feedbackDiv.innerHTML = `<h2>${trans.whoChallengeTitle}</h2><p>${trans.whoChallengeMessage}</p>`;
  
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  
  setTimeout(() => {
    isWHOChallenge = true;
    currentQuestionIndex = 0;
    loadQuestion();
  }, 3000);
}

/**
 * Check the player's answer
 */
function checkAnswer(correct, buttonElement, explanation) {
  const allButtons = document.querySelectorAll("#answers button");
  allButtons.forEach(btn => btn.disabled = true);

  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.classList.remove("correct", "incorrect");

  const avatarDiv = document.getElementById("avatar");
  if (avatarDiv) {
    avatarDiv.classList.remove("state-correct", "state-incorrect");
    // Force reflow so the reaction animation replays even for consecutive same-result answers
    void avatarDiv.offsetWidth;
  }

  const trans = translations[language];

  if (correct) {
    buttonElement.classList.add("correct");
    feedbackDiv.classList.add("correct");
    feedbackDiv.innerHTML = trans.correctAnswer + "<br><em>" + explanation + "</em>";
    answeredCorrectly++;
    if (avatarDiv) avatarDiv.classList.add("state-correct");
  } else {
    buttonElement.classList.add("incorrect");
    feedbackDiv.classList.add("incorrect");
    feedbackDiv.innerHTML = trans.incorrectAnswer + "<br><em>" + explanation + "</em>";
    safetyScore -= 10;
    trustScore -= 10;
    if (avatarDiv) avatarDiv.classList.add("state-incorrect");
  }

  updateBars();
  pushLiveScore(isWHOChallenge ? "who_challenge" : "playing");

  setTimeout(() => {
    if (avatarDiv) avatarDiv.classList.remove("state-correct", "state-incorrect");
    currentQuestionIndex++;
    loadQuestion();
  }, 3000);
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

  const roleQuestions = questions[selectedRole] || [];
  const whoQuestions = questions["WHOChallenges"];
  const totalQuestions = roleQuestions.length + whoQuestions.length;
  const finalScore = Math.round((answeredCorrectly / totalQuestions) * 100);
  document.getElementById("finalScore").innerHTML = finalScore + "%";
  document.getElementById("playerInfo").innerHTML = `<strong>${player.role}</strong>`;

  pushLiveScore("finished", { finalScore });
}

/**
 * Called by the "New Game" button on the game-over screen: the final score
 * was already pushed to the live scoreboard in endGame(), so just reload to
 * start a fresh session.
 */
function saveScoreAndReload() {
  location.reload();
}

// Initialize with Arabic on page load
window.addEventListener('DOMContentLoaded', () => {
  setLanguage("ar");
});
