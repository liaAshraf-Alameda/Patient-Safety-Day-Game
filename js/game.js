// Game state
let language = "ar";
let currentQuestionIndex = 0;
let safetyScore = 100;
let trustScore = 100;
let answeredCorrectly = 0;
let selectedRole = null;
let isWHOChallenge = false;

let player = {
  name: "",
  department: "",
  role: ""
};

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
      voice: "من فضلك راجع جميع أدويتي."
    },
    {
      station: "Consultation",
      question: "المريض لا يفهم التشخيص.",
      options: ["تزويد المريض بمواد تثقيفية", "شرح الحالة بلغة بسيطة والتأكد من فهمه", "تحديد موعد متابعة لمناقشة الحالة"],
      correct: 1,
      explanation: "إشراك المريض يبدأ بالفهم.",
      voice: "من فضلك اشرح حالتي."
    }
  ],
  Nurse: [
    {
      station: "Ward",
      question: "المريض يشعر بالدوخة عند الوقوف.",
      options: ["تذكير المريض بطلب المساعدة", "تقييم خطر السقوط وتطبيق الوقاية", "إبلاغ الطبيب"],
      correct: 1,
      explanation: "تقييم خطر السقوط هو الإجراء الأكثر أماناً.",
      voice: "أخشى السقوط."
    }
  ],
  Pharmacist: [
    {
      station: "Pharmacy",
      question: "قبل صرف الدواء.",
      options: ["مراجعة الوصفة", "التحقق من الهوية باستخدام معرفين", "مراجعة السجل الدوائي"],
      correct: 1,
      explanation: "التحقق من الهوية يمنع الأخطاء الدوائية.",
      voice: "هذا دوائي؟"
    }
  ],
  Kitchen: [
    {
      station: "Nutrition",
      question: "مريض السكري طلب وجبة إضافية.",
      options: ["مراجعة احتياجاته الغذائية", "توفير خيار يتوافق مع الخطة الغذائية العلاجية", "التنسيق مع التمريض بشأن الطلب"],
      correct: 1,
      explanation: "الخطة الغذائية العلاجية يجب أن تدعم السيطرة على المرض المزمن.",
      voice: "ساعدوني في اختيار الطعام المناسب."
    },
    {
      station: "Nutrition",
      question: "يوجد تحسس غذائي موثق للمريض.",
      options: ["مراجعة مكونات الوجبة", "التأكد من خلو الوجبة من المادة المسببة للتحسس", "مراجعة تفضيلات المريض الغذائية"],
      correct: 1,
      explanation: "منع التعرض لمسببات الحساسية يقلل المخاطر بشكل كبير.",
      voice: "لدي حساسية غذائية."
    },
    {
      station: "Nutrition",
      question: "وصلت وجبة إلى مريض مختلف.",
      options: ["مراجعة رقم الغرفة", "مطابقة هوية المريض قبل تسليم الوجبة", "الرجوع إلى قائمة الوجبات"],
      correct: 1,
      explanation: "مطابقة هوية المريض تمنع الأخطاء الغذائية.",
      voice: "أريد الوجبة المخصصة لي."
    },
    {
      station: "Nutrition",
      question: "درجة حرارة الطعام غير مناسبة.",
      options: ["تقييم صلاحية الوجبة", "استبدال الوجبة وفق متطلبات سلامة الغذاء", "التواصل مع قسم التغذية"],
      correct: 1,
      explanation: "سلامة الغذاء تشمل تقديم الطعام بدرجة حرارة مناسبة.",
      voice: "أريد طعاماً آمناً."
    },
    {
      station: "Nutrition",
      question: "المريض يعاني من صعوبة البلع.",
      options: ["متابعة استهلاك الوجبة", "إبلاغ الفريق المعالج وتعديل الخطة الغذائية", "مراجعة تفضيلات الطعام"],
      correct: 1,
      explanation: "صعوبة البلع تزيد خطر الاختناق والشفط الرئوي.",
      voice: "الأكل أصبح صعباً."
    },
    {
      station: "Nutrition",
      question: "المريض لا يتناول كامل وجبته.",
      options: ["تسجيل كمية الطعام المستهلكة", "مناقشة الأسباب مع المريض وتعديل الخطة الغذائية", "طلب تقييم غذائي إضافي"],
      correct: 1,
      explanation: "فهم السبب يساعد في تحسين الحالة الغذائية.",
      voice: "لا أستطيع إنهاء وجبتي."
    },
    {
      station: "Nutrition",
      question: "المريض يريد إحضار طعام من المنزل.",
      options: ["مراجعة نوع الطعام", "تقييم توافق الطعام مع الخطة العلاجية", "توثيق الطلب"],
      correct: 1,
      explanation: "يجب التأكد من أن الطعام يدعم الخطة العلاجية.",
      voice: "أفضل بعض الأطعمة من المنزل."
    },
    {
      station: "Nutrition",
      question: "المريض يعاني من ضعف الشهية.",
      options: ["تسجيل الملاحظة", "إشراك أخصائي التغذية والمريض في الخطة الغذائية", "زيادة عدد الوجبات"],
      correct: 1,
      explanation: "التعاون مع المريض يحسن فرص الالتزام بالخطة.",
      voice: "لا أشعر برغبة كبيرة في الطعام."
    },
    {
      station: "Nutrition",
      question: "تم تعديل الخطة الغذائية.",
      options: ["إرسال الخطة للمريض", "شرح التعديل للمريض والتأكد من فهمه", "توثيق التعديل"],
      correct: 1,
      explanation: "فهم المريض للخطة جزء من الرعاية المتمركزة حوله.",
      voice: "أريد معرفة سبب تغيير النظام الغذائي."
    },
    {
      station: "Nutrition",
      question: "المريض يستعد للخروج من المستشفى.",
      options: ["تسليم تعليمات مكتوبة", "مراجعة التعليمات الغذائية وخطة المتابعة معه", "إعطاؤه موعداً للمتابعة"],
      correct: 1,
      explanation: "استمرار الرعاية بعد الخروج مهم لمرضى الأمراض المزمنة.",
      voice: "كيف أستمر على النظام الغذائي في المنزل؟"
    }
  ],
  Housekeeping: [
    {
      station: "Housekeeping",
      question: "انسكب سائل في ممر المرضى.",
      options: ["إبلاغ المشرف", "تأمين المنطقة وتنظيفها ووضع علامة تحذيرية", "جدولة التنظيف ضمن الأعمال الحالية"],
      correct: 1,
      explanation: "التدخل الفوري يقلل خطر السقوط.",
      voice: "أريد بيئة آمنة."
    },
    {
      station: "Housekeeping",
      question: "سلة النفايات الطبية ممتلئة.",
      options: ["متابعة مستوى الامتلاء", "استبدالها وفق السياسة المعتمدة", "إبلاغ القسم المعني"],
      correct: 1,
      explanation: "إدارة النفايات بشكل صحيح جزء من سلامة المرضى.",
      voice: "حافظوا على البيئة آمنة."
    },
    {
      station: "Housekeeping",
      question: "بعد الانتهاء من تنظيف غرفة مريض.",
      options: ["إزالة معدات التنظيف", "تطبيق نظافة اليدين وفق السياسة", "تجهيز المعدات للمهمة التالية"],
      correct: 1,
      explanation: "نظافة اليدين تقلل انتقال العدوى.",
      voice: "احموني من العدوى."
    },
    {
      station: "Housekeeping",
      question: "يتم تنظيف غرفة تحت احتياطات العزل.",
      options: ["مراجعة خطة التنظيف", "تطبيق احتياطات العزل أثناء التنظيف", "التنسيق مع الفريق"],
      correct: 1,
      explanation: "العزل يمنع انتقال العدوى داخل المستشفى.",
      voice: "أحتاج إلى حماية إضافية."
    },
    {
      station: "Housekeeping",
      question: "تُستخدم أدوات تنظيف في عدة مناطق.",
      options: ["فحص حالة الأدوات", "منع التلوث المتبادل بين المناطق", "تنظيم المعدات بالمستودع"],
      correct: 1,
      explanation: "منع انتقال الملوثات بين المناطق ضروري.",
      voice: "أريد غرفة نظيفة وآمنة."
    },
    {
      station: "Housekeeping",
      question: "أبلغ مريض عن منطقة زلقة.",
      options: ["تسجيل البلاغ", "تقييم الخطر ومعالجته فوراً", "مراجعة خطة التنظيف"],
      correct: 1,
      explanation: "إزالة الخطر بسرعة تمنع الحوادث.",
      voice: "الممر غير آمن."
    },
    {
      station: "Housekeeping",
      question: "اكتشاف خطر بيئي داخل القسم.",
      options: ["إبلاغ الإدارة", "الاستجابة الفورية وتقليل الخطر", "تسجيل ملاحظة بالموقع"],
      correct: 1,
      explanation: "سلامة البيئة جزء من سلامة الرعاية.",
      voice: "أحتاج إلى بيئة آمنة."
    },
    {
      station: "Housekeeping",
      question: "غرفة عالية الخطورة بحاجة للتنظيف.",
      options: ["بدء التنظيف", "التحقق من اكتمال التنظيف والتطهير حسب السياسة", "تغيير مواد التنظيف"],
      correct: 1,
      explanation: "المناطق عالية الخطورة تتطلب تحققاً إضافياً.",
      voice: "أتوقع بيئة آمنة ونظيفة."
    },
    {
      station: "Housekeeping",
      question: "معدات تنظيف ملوثة.",
      options: ["تنظيفها لاحقاً", "عزلها واستبدالها وفق السياسة", "تسجيل الملاحظة"],
      correct: 1,
      explanation: "استخدام أدوات ملوثة قد ينقل العدوى.",
      voice: "حافظوا على نظافة المكان."
    },
    {
      station: "Housekeeping",
      question: "خطر متكرر في نفس الموقع.",
      options: ["إبلاغ المشرف فقط", "الإبلاغ والمشاركة في إجراءات التحسين", "متابعة الملاحظة مستقبلاً"],
      correct: 1,
      explanation: "التحسين المستمر يمنع تكرار الحوادث.",
      voice: "لا أريد تكرار المشكلة."
    }
  ],
  Maintenance: [
    {
      station: "Maintenance",
      question: "يوجد سلك كهربائي مكشوف بالممر.",
      options: ["إبلاغ قسم الصيانة", "تأمين الخطر ومعالجة المشكلة فوراً", "إدراجه ضمن خطة العمل"],
      correct: 1,
      explanation: "إزالة الخطر الفوري تحمي المرضى والموظفين.",
      voice: "أريد ممراً آمناً."
    },
    {
      station: "Maintenance",
      question: "فرامل سرير المريض لا تعمل.",
      options: ["تقييم حالة السرير", "إصلاح السرير أو استبداله قبل الاستخدام", "متابعة البلاغ مع القسم"],
      correct: 1,
      explanation: "سرير غير آمن قد يؤدي إلى سقوط المريض.",
      voice: "سريري يجب أن يكون آمناً."
    },
    {
      station: "Maintenance",
      question: "تم اكتشاف خلل في إنذار الحريق.",
      options: ["جدولة الإصلاح", "إعادة النظام للعمل بأسرع وقت", "مراجعة سجل الصيانة"],
      correct: 1,
      explanation: "أنظمة الإنذار ضرورية للاستجابة للطوارئ.",
      voice: "أريد مستشفى آمنة."
    },
    {
      station: "Maintenance",
      question: "الأرضية غير مستوية بمنطقة المرضى.",
      options: ["تقييم المشكلة", "معالجة الخطر لمنع التعثر والسقوط", "مراجعة خطة الصيانة"],
      correct: 1,
      explanation: "منع السقوط من أولويات سلامة المرضى.",
      voice: "أحتاج إلى ممر آمن."
    },
    {
      station: "Maintenance",
      question: "وصل موعد الصيانة الوقائية لجهاز طبي.",
      options: ["مراجعة أداء الجهاز", "تنفيذ الصيانة الوقائية حسب الجدول", "التنسيق مع المستخدمين"],
      correct: 1,
      explanation: "الصيانة الوقائية تقلل الأعطال المفاجئة.",
      voice: "أعتمد على الأجهزة بأمان."
    },
    {
      station: "Maintenance",
      question: "زر طلب المساعدة لا يعمل.",
      options: ["مراجعة البلاغ", "إصلاح النظام فوراً لضمان إمكانية الاستخدام", "جدولة زيارة فنية"],
      correct: 1,
      explanation: "وسائل طلب المساعدة عنصر حيوي لسلامة المريض.",
      voice: "قد أحتاج المساعدة في أي لحظة."
    },
    {
      station: "Maintenance",
      question: "عطل متكرر في جهاز طبي.",
      options: ["إصلاح العطل الحالي", "تحليل السبب الجذري واتخاذ إجراء دائم", "متابعة أداء الجهاز"],
      correct: 1,
      explanation: "تحليل السبب الجذري يمنع تكرار المشكلة.",
      voice: "أحتاج أجهزة موثوقة."
    },
    {
      station: "Maintenance",
      question: "حدث عطل في المصعد المستخدم لنقل المرضى.",
      options: ["إغلاق المصعد", "إدارة الخطر وتأمين بديل آمن للمرضى", "تسجيل البلاغ"],
      correct: 1,
      explanation: "استمرارية الخدمة مهمة لسلامة المرضى.",
      voice: "أحتاج التنقل بأمان."
    },
    {
      station: "Maintenance",
      question: "إضاءة الممرات غير كافية.",
      options: ["فحص النظام", "إصلاح الإضاءة لمنع الحوادث", "إبلاغ الإدارة"],
      correct: 1,
      explanation: "الرؤية الواضحة تقلل خطر السقوط.",
      voice: "الإضاءة تساعدني على الحركة بأمان."
    },
    {
      station: "Maintenance",
      question: "تم الانتهاء من صيانة جهاز طبي.",
      options: ["إغلاق البلاغ", "التأكد من سلامة الجهاز قبل إعادته للاستخدام", "إبلاغ القسم"],
      correct: 1,
      explanation: "التحقق بعد الصيانة جزء من السلامة.",
      voice: "أريد جهازاً آمناً وموثوقاً."
    }
  ],
  Administration: [
    {
      station: "Registration",
      question: "وصول المريض للتسجيل.",
      options: ["مراجعة بيانات الموعد", "التحقق من الهوية باستخدام معرفين معتمدين", "مراجعة الملف الطبي السابق"],
      correct: 1,
      explanation: "التعريف الصحيح بالمريض من أهم عناصر سلامة المرضى.",
      voice: "أريد التأكد من أنني المريض الصحيح."
    },
    {
      station: "Patient Rights",
      question: "المريض لا يعرف حقوقه أثناء تلقي الرعاية.",
      options: ["تزويده بمعلومات عامة عن المستشفى", "شرح حقوق المرضى وطرق الحصول على الدعم", "توجيهه إلى مكتب علاقات المرضى"],
      correct: 1,
      explanation: "معرفة الحقوق تعزز مشاركة المريض في الرعاية.",
      voice: "أريد معرفة حقوقي داخل المستشفى."
    },
    {
      station: "Complaint Management",
      question: "تم استلام شكوى تتعلق بسلامة المرضى.",
      options: ["توثيق الشكوى في النظام", "التحقيق في الأسباب واتخاذ إجراءات تحسين", "مشاركة الشكوى مع الإدارة المعنية"],
      correct: 1,
      explanation: "دراسة الشكاوى تساعد على تقليل المخاطر المستقبلية.",
      voice: "أريد أن تؤخذ مخاوفي على محمل الجد."
    },
    {
      station: "Shared Decision",
      question: "المريض يرغب بالمشاركة في القرار العلاجي.",
      options: ["تزويده بالمعلومات اللازمة", "إشراكه وأسرته في مناقشة الخيارات العلاجية", "توثيق رغبته بالمشاركة"],
      correct: 1,
      explanation: "الرعاية المتمركزة حول المريض تعتمد على المشاركة الفعلية.",
      voice: "أريد أن أكون جزءاً من القرار."
    },
    {
      station: "Communication",
      question: "المريض يحتاج دعماً لغوياً لفهم الرعاية.",
      options: ["توفير مواد مكتوبة مناسبة", "توفير وسيلة تواصل أو ترجمة فعالة", "التنسيق مع الفريق المسؤول"],
      correct: 1,
      explanation: "التواصل الفعال يقلل مخاطر سوء الفهم.",
      voice: "ساعدوني على فهم الرعاية المقدمة لي."
    },
    {
      station: "Test Results",
      question: "يرغب المريض في الاطلاع على نتائج الفحوصات.",
      options: ["تزويده بملخص للنتائج", "مراجعة النتائج معه وشرح معناها", "إتاحة نسخة من التقرير"],
      correct: 1,
      explanation: "فهم النتائج يساعد المريض على اتخاذ قرارات أفضل.",
      voice: "أريد أن أفهم نتائج فحوصاتي."
    },
    {
      station: "Transfer of Care",
      question: "تم نقل المريض إلى قسم جديد.",
      options: ["تحديث موقع المريض في النظام", "التأكد من اكتمال التواصل ونقل المعلومات للمريض والقسم الجديد", "إرسال إشعار للقسم المستقبل"],
      correct: 1,
      explanation: "استمرارية المعلومات عنصر أساسي لسلامة المرضى.",
      voice: "أريد أن تكون جميع معلوماتي متاحة للفريق الجديد."
    },
    {
      station: "Care Plan",
      question: "طلب المريض نسخة من الخطة العلاجية.",
      options: ["توفير ملخص للخطة", "تسليم نسخة وشرحها للمريض", "توثيق الطلب في الملف"],
      correct: 1,
      explanation: "فهم الخطة العلاجية يزيد الالتزام بالعلاج.",
      voice: "أريد معرفة تفاصيل خطة علاجي."
    },
    {
      station: "Follow-up",
      question: "يواجه المريض صعوبة في حجز موعد متابعة.",
      options: ["إبلاغ القسم المختص", "تسهيل الوصول للخدمة المناسبة", "إعطاؤه معلومات الاتصال"],
      correct: 1,
      explanation: "استمرارية الرعاية بعد الخروج عنصر مهم للمرضى المزمنين.",
      voice: "أحتاج للوصول بسهولة إلى الرعاية."
    },
    {
      station: "Coordination",
      question: "المريض يحتاج دعماً إضافياً من أكثر من قسم.",
      options: ["إبلاغ الأقسام المعنية", "تنسيق الرعاية بين الفرق المختلفة", "توثيق الحاجة في الملف"],
      correct: 1,
      explanation: "التنسيق الفعال يضمن رعاية متكاملة.",
      voice: "أحتاج إلى فريق يعمل معي كوحدة واحدة."
    }
  ],
  WHOChallenges: [
    {
      station: "WHO Gold Challenge",
      question: "ما أفضل مؤشر على أن المريض أصبح شريكاً حقيقياً في الرعاية؟",
      options: ["حضوره لجميع المواعيد", "مشاركته الفعلية في اتخاذ القرارات وفهم الخطة العلاجية", "استلامه مواد تثقيفية مكتوبة"],
      correct: 1,
      explanation: "الشراكة الحقيقية تعني مشاركة فعالة في القرارات المتعلقة بالرعاية.",
      voice: "أريد أن يكون صوتي مسموعاً."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أهم وسيلة لتقليل الضرر أثناء رحلة المريض داخل المستشفى؟",
      options: ["زيادة استخدام الأنظمة الإلكترونية", "التواصل الفعال وإشراك المريض", "زيادة عدد الإجراءات الرقابية"],
      correct: 1,
      explanation: "التواصل ومشاركة المريض من أكثر العوامل تأثيراً على سلامة المرضى.",
      voice: "أريد أن أفهم ما يحدث لي في كل خطوة."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أهم عنصر في انتقال الرعاية الآمن بين الأقسام؟",
      options: ["استخدام نماذج موحدة", "مشاركة المعلومات الأساسية وإشراك المريض", "إرسال الملف الطبي كاملاً"],
      correct: 1,
      explanation: "انتقال المعلومات الصحيحة ومشاركة المريض يقللان الأخطاء.",
      voice: "أريد أن يعرف كل فريق حالتي بشكل صحيح."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما أفضل وسيلة لتحسين نتائج مرضى الأمراض غير السارية؟",
      options: ["زيادة عدد الزيارات الطبية", "إشراك المريض في إدارة حالته الصحية", "تكثيف الفحوصات الدورية"],
      correct: 1,
      explanation: "إدارة المريض لحالته الصحية عنصر محوري في الأمراض المزمنة.",
      voice: "أريد أن أتمكن من إدارة مرضي بثقة."
    },
    {
      station: "WHO Gold Challenge",
      question: "ما الرسالة الرئيسية لليوم العالمي لسلامة المرضى؟",
      options: ["التكنولوجيا تحسن جودة الرعاية", "الرعاية الأكثر أماناً تتحقق عندما يكون المريض شريكاً في الرعاية", "زيادة الموارد تقلل الأخطاء"],
      correct: 1,
      explanation: "الشراكة مع المرضى والأسر هي جوهر سلامة المرضى الحديثة.",
      voice: "أنا لست متلقياً للرعاية فقط... أنا شريك في سلامتي."
    }
  ]
};

// Language translations
const translations = {
  ar: {
    browserTitle: "لعبة رحلة المريض الآمنة",
    mainTitle: "🏥 لعبة رحلة المريض الآمنة",
    subTitle: "اليوم العالمي لسلامة المرضى 2026",
    missionText: "ساعد عم سمير على إكمال رحلة آمنة داخل المستشفى",
    regTitle: "بيانات اللاعب",
    nameLabel: "الاسم",
    namePlaceholder: "اكتب اسمك",
    deptLabel: "القسم",
    deptPlaceholder: "اكتب القسم",
    roleLabel: "الدور الوظيفي",
    startBtn: "دخول اللعبة",
    patientName: "عم سمير",
    safetyLabel: "درجة السلامة",
    trustLabel: "ثقة المريض",
    journeyTitle: "🏥 رحلة عم سمير الآمنة",
    currentStationLabel: "المحطة الحالية",
    questionPlaceholder: "سيتم تحميل السؤال هنا",
    gameOverTitle: "تم إكمال اللعبة!",
    finalMessage: "شكراً لك على مساعدتك لعم سمير على إكمال رحلة آمنة!",
    playAgainBtn: "لعبة جديدة",
    correctAnswer: "✓ إجابة صحيحة! ممتاز!",
    incorrectAnswer: "✗ إجابة خاطئة. تقليل الثقة والسلامة",
    whoChallengeTitle: "🏆 تحديات اليوم العالمي لسلامة المرضى",
    whoChallengeMessage: "أكملت أسئلتك بنجاح! الآن حان وقت التحدي النهائي!"
  },
  en: {
    browserTitle: "Safe Patient Journey Game",
    mainTitle: "🏥 Safe Patient Journey Game",
    subTitle: "World Patient Safety Day 2026",
    missionText: "Help Mr. Samir complete a safe journey through the hospital.",
    regTitle: "Player Information",
    nameLabel: "Name",
    namePlaceholder: "Enter your name",
    deptLabel: "Department",
    deptPlaceholder: "Enter your department",
    roleLabel: "Role",
    startBtn: "Start Game",
    patientName: "Mr. Samir",
    safetyLabel: "Patient Safety Score",
    trustLabel: "Patient Trust",
    journeyTitle: "🏥 Mr. Samir's Safe Journey",
    currentStationLabel: "Current Station",
    questionPlaceholder: "The question will appear here",
    gameOverTitle: "Game Complete!",
    finalMessage: "Thank you for helping Mr. Samir complete a safe hospital journey!",
    playAgainBtn: "Play Again",
    correctAnswer: "✓ Correct! Excellent!",
    incorrectAnswer: "✗ Incorrect. Safety and trust decreased",
    whoChallengeTitle: "🏆 World Patient Safety Day Challenges",
    whoChallengeMessage: "You completed your questions successfully! Now it's time for the final challenge!"
  }
};

const roleLabels = {
  ar: {
    Doctor: "👨‍⚕️ طبيب",
    Nurse: "👩‍⚕️ ممرض/ممرضة",
    Pharmacist: "💊 صيدلي",
    Kitchen: "🍲 التغذية",
    Housekeeping: "🧹 النظافة",
    Maintenance: "🔧 الصيانة",
    Administration: "📋 الإدارة"
  },
  en: {
    Doctor: "👨‍⚕️ Doctor",
    Nurse: "👩‍⚕️ Nurse",
    Pharmacist: "💊 Pharmacist",
    Kitchen: "🍲 Kitchen",
    Housekeeping: "🧹 Housekeeping",
    Maintenance: "🔧 Maintenance",
    Administration: "📋 Administration"
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
  document.documentElement.lang = lang;

  const trans = translations[lang];
  document.title = trans.browserTitle;
  document.getElementById("mainTitle").innerHTML = trans.mainTitle;
  document.getElementById("subTitle").innerHTML = trans.subTitle;
  document.getElementById("missionText").innerHTML = trans.missionText;
  
  if (document.getElementById("regTitle")) {
    document.getElementById("regTitle").innerHTML = trans.regTitle;
    document.getElementById("nameLabel").innerHTML = trans.nameLabel;
    document.getElementById("playerName").placeholder = trans.namePlaceholder;
    document.getElementById("deptLabel").innerHTML = trans.deptLabel;
    document.getElementById("department").placeholder = trans.deptPlaceholder;
    document.getElementById("roleLabel").innerHTML = trans.roleLabel;
    document.getElementById("startBtn").innerHTML = trans.startBtn;
    updateRoleOptions(lang);
  }

  if (document.getElementById("patientName")) {
    document.getElementById("patientName").innerHTML = trans.patientName;
    document.getElementById("safetyLabel").innerHTML = trans.safetyLabel;
    document.getElementById("trustLabel").innerHTML = trans.trustLabel;
    document.getElementById("journeyTitle").innerHTML = trans.journeyTitle;
    if (!document.getElementById("gameScreen").classList.contains("hidden")) {
      loadQuestion();
    } else if (!document.getElementById("registrationScreen").classList.contains("hidden")) {
      document.getElementById("currentStation").innerHTML = trans.currentStationLabel;
      document.getElementById("questionText").innerHTML = trans.questionPlaceholder;
    }
  }

  if (document.getElementById("gameOverTitle")) {
    document.getElementById("gameOverTitle").innerHTML = trans.gameOverTitle;
    document.getElementById("finalMessage").innerHTML = trans.finalMessage;
    document.getElementById("playAgainBtn").innerHTML = trans.playAgainBtn;
    if (!document.getElementById("gameOverScreen").classList.contains("hidden") && player.name) {
      document.getElementById("playerInfo").innerHTML = getPlayerInfoText();
    }
  }
}

function updateRoleOptions(lang) {
  document.querySelectorAll("#role option").forEach(option => {
    option.textContent = roleLabels[lang][option.value] || option.value;
  });
}

function getPlayerInfoText() {
  const roleLabel = roleLabels[language][player.role] || player.role;
  return language === "ar"
    ? `<strong>${player.name}</strong> - ${roleLabel} في ${player.department}`
    : `<strong>${player.name}</strong> - ${roleLabel} in ${player.department}`;
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

  selectedRole = player.role;
  currentQuestionIndex = 0;
  isWHOChallenge = false;
  loadQuestion();
}

/**
 * Load a specific question based on player role
 */
function loadQuestion() {
  const roleQuestions = isWHOChallenge ? questions["WHOChallenges"] : (questions[selectedRole] || questions["WHOChallenges"]);
  
  if (currentQuestionIndex >= roleQuestions.length) {
    // If we just finished role questions, move to WHO Challenge
    if (!isWHOChallenge) {
      showWHOChallengeIntro();
    } else {
      // If we finished WHO Challenge, end the game
      endGame();
    }
    return;
  }

  const question = roleQuestions[currentQuestionIndex];

  document.getElementById("currentStation").innerHTML = language === "ar" ? `المحطة: ${question.station}` : `Station: ${question.station}`;
  document.getElementById("questionText").innerHTML = question.question;

  document.getElementById("answers").innerHTML = "";
  document.getElementById("feedback").innerHTML = "";

  const answersDiv = document.getElementById("answers");
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.innerHTML = option;
    button.onclick = () => checkAnswer(index === question.correct, button, question.explanation);
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
  feedbackDiv.classList.remove("correct", "incorrect");
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

  const trans = translations[language];

  if (correct) {
    buttonElement.classList.add("correct");
    feedbackDiv.classList.add("correct");
    feedbackDiv.innerHTML = trans.correctAnswer + "<br><em>" + explanation + "</em>";
    answeredCorrectly++;
  } else {
    buttonElement.classList.add("incorrect");
    feedbackDiv.classList.add("incorrect");
    feedbackDiv.innerHTML = trans.incorrectAnswer + "<br><em>" + explanation + "</em>";
    safetyScore -= 10;
    trustScore -= 10;
  }

  updateBars();

  setTimeout(() => {
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
  document.getElementById("playerInfo").innerHTML = getPlayerInfoText();
}

function saveScoreAndReload() {
  location.reload();
}

// Initialize with Arabic on page load
window.addEventListener('DOMContentLoaded', () => {
  setLanguage("ar");
});
