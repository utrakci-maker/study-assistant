'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

type Lang = 'en' | 'ar' | 'ku'

const T = {
  en: {
    dir: 'ltr' as const,
    nav_how: 'How It Works',
    nav_features: 'Features',
    nav_pricing: 'Pricing',
    nav_faq: 'FAQ',
    nav_cta: 'Try Free',
    hero_tag: '✨ Works in Arabic, Kurdish & English',
    hero_h1: 'Turn Any Textbook Photo Into a Complete Study Plan',
    hero_sub: 'Snap a photo of any textbook page or handwritten notes. Get a structured study plan, expert explanation, and adaptive quiz — in 30 seconds. Your private AI tutor, available 24/7.',
    hero_cta: 'Start for Free — No Registration',
    hero_secondary: '↓ See how it works',
    hero_trust1: 'No sign-up required',
    hero_trust2: 'Free to start',
    hero_trust3: 'Works on any phone',
    hero_trust4: '100% secure',
    preview_title: 'What you get after every upload',
    preview_1_title: 'Structured Study Plan',
    preview_1_desc: '7-step action plan telling you exactly what to study and why',
    preview_2_title: 'Expert Explanation',
    preview_2_desc: 'Core concept · Key principles · Common mistakes · Memory tips',
    preview_3_title: 'Graded Quiz',
    preview_3_desc: '5 questions across Easy, Medium and Hard — with full explanations',
    how_title: 'Three Steps. Thirty Seconds.',
    how_sub: 'No setup. No account. Just results.',
    step1_title: 'Snap a Photo',
    step1_desc: 'Take a clear photo of any textbook page, handwritten notes, or exam paper. Any subject. Any level.',
    step2_title: 'AI Analyses It',
    step2_desc: 'Our AI reads the content and detects the language automatically — Arabic, Kurdish, or English.',
    step3_title: 'Get Your Study Plan',
    step3_desc: 'Receive a full study plan, detailed explanation broken into clear sections, and a 5-question quiz with difficulty levels.',
    feat_title: 'Built for Serious Students',
    feat_sub: 'Every feature is designed to help you understand — not just memorise.',
    f1_title: '3 Languages, Fully Supported',
    f1_desc: 'Arabic (عربية), Kurdish (کوردی), and English — detected automatically from your photo. No switching needed.',
    f2_title: 'Deep Explanations',
    f2_desc: 'Every result includes: Core Concept, Key Principles with examples, Common Mistakes, Real-World Applications, and a Memory Tip.',
    f3_title: 'Adaptive Quiz with Difficulty',
    f3_desc: '5 questions per topic — 2 Easy (recall), 2 Medium (understanding), 1 Hard (analysis). Each wrong answer is fully explained.',
    f4_title: 'Your Full Study History',
    f4_desc: 'Every study plan you have ever created is saved. Search your history and revisit any topic at any time.',
    f5_title: 'Copy & Share Instantly',
    f5_desc: 'One tap to copy your complete study plan. Share it to WhatsApp, Telegram, or save it to your notes.',
    f6_title: 'Works on Any Phone',
    f6_desc: 'Designed for mobile. Take a photo in class, on the bus, at home — your study plan is ready before you put your phone down.',
    subjects_title: 'Works Across Every Subject',
    subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'History', 'Geography', 'Arabic Literature', 'Islamic Studies', 'Computer Science', 'Economics', 'Sociology', 'English'],
    price_title: 'Simple, Fair Pricing',
    price_sub: 'Start free. Upgrade only when you need more.',
    plan1_name: 'Free',
    plan1_price: '$0',
    plan1_period: 'forever',
    plan1_desc: 'Perfect for trying it out',
    plan1_f1: '2 uploads per day',
    plan1_f2: '6 uploads per month',
    plan1_f3: 'Full study plan + quiz',
    plan1_f4: 'Arabic, Kurdish & English',
    plan1_cta: 'Start for Free',
    plan2_name: 'Single Unlock',
    plan2_badge: 'Most Popular',
    plan2_price: '$0.99',
    plan2_period: 'per extra upload',
    plan2_desc: 'Pay only when you need more',
    plan2_f1: '1 extra upload — no expiry',
    plan2_f2: 'No subscription',
    plan2_f3: 'Pay via ZainCash, FIB, WhatsApp',
    plan2_f4: 'All free features included',
    plan2_cta: 'Get Extra Upload',
    plan3_name: 'Pro Monthly',
    plan3_price: '$10',
    plan3_period: 'per month',
    plan3_desc: 'For students who study daily',
    plan3_f1: '60 uploads per month',
    plan3_f2: 'No daily limit',
    plan3_f3: 'All features unlocked',
    plan3_f4: 'Cancel anytime',
    plan3_cta: 'Go Pro',
    faq_title: 'Common Questions',
    faqs: [
      { q: 'Do I need to create an account?', a: 'No. Just enter your phone number and email when you upload. No password, no registration form — just go.' },
      { q: 'What subjects does it work with?', a: 'Any subject with text or diagrams. Biology, Chemistry, Physics, History, Geography, Math, Computer Science, Islamic Studies, Literature — if it is written on paper or a slide, it works.' },
      { q: 'How long does it take?', a: 'Usually 15–30 seconds for a full study plan, explanation, and quiz. Occasionally up to 60 seconds for complex content.' },
      { q: 'Does it actually read Arabic and Kurdish text in the photo?', a: 'Yes. The AI reads text in Arabic, Sorani Kurdish, and English directly from your image. It also detects the language automatically and responds in the same language.' },
      { q: 'What if I run out of free uploads?', a: 'Contact us on WhatsApp to pay and receive an unlock code. We support ZainCash, FIB, Visa/Mastercard, and bank transfer. The code is sent instantly after payment.' },
      { q: 'Is my data private?', a: 'Yes. Your images and study plans are stored securely and can only be accessed using your phone number and email. We never share your data.' },
    ],
    cta_title: 'Start Studying Smarter Today',
    cta_sub: 'Free to start. No registration. Works on any phone.',
    cta_btn: 'Upload Your First Photo →',
    footer_copy: '© 2024 StudyAI · Powered by Claude AI · Built for students in Iraq & MENA',
  },

  ar: {
    dir: 'rtl' as const,
    nav_how: 'كيف يعمل',
    nav_features: 'المميزات',
    nav_pricing: 'الأسعار',
    nav_faq: 'الأسئلة الشائعة',
    nav_cta: 'جرّب مجاناً',
    hero_tag: '✨ يعمل بالعربية والكردية والإنجليزية',
    hero_h1: 'حوّل أي صورة من كتابك إلى خطة دراسية متكاملة',
    hero_sub: 'صوّر أي صفحة من كتابك أو ملاحظاتك المكتوبة بخط اليد. احصل على خطة دراسة منظّمة وشرح احترافي واختبار تكيّفي — في 30 ثانية. مدرّسك الخاص بالذكاء الاصطناعي، متاح 24 ساعة في اليوم.',
    hero_cta: 'ابدأ مجاناً — بدون تسجيل',
    hero_secondary: '↓ اكتشف كيف يعمل',
    hero_trust1: 'لا حاجة لإنشاء حساب',
    hero_trust2: 'مجاني للبدء',
    hero_trust3: 'يعمل على أي هاتف',
    hero_trust4: '100% آمن',
    preview_title: 'ما ستحصل عليه بعد كل رفع',
    preview_1_title: 'خطة دراسة منظّمة',
    preview_1_desc: 'خطة من 7 خطوات تخبرك بالضبط بما تدرسه ولماذا',
    preview_2_title: 'شرح احترافي',
    preview_2_desc: 'المفهوم الأساسي · المبادئ الرئيسية · الأخطاء الشائعة · نصائح الحفظ',
    preview_3_title: 'اختبار متدرّج الصعوبة',
    preview_3_desc: '5 أسئلة بمستويات سهلة ومتوسطة وصعبة — مع شرح كامل لكل إجابة',
    how_title: 'ثلاث خطوات. ثلاثون ثانية.',
    how_sub: 'لا إعداد. لا حساب. فقط نتائج.',
    step1_title: 'صوّر الصفحة',
    step1_desc: 'التقط صورة واضحة لأي صفحة من الكتاب المدرسي أو ملاحظاتك أو ورقة الاختبار. أي مادة. أي مستوى.',
    step2_title: 'يحلّلها الذكاء الاصطناعي',
    step2_desc: 'يقرأ الذكاء الاصطناعي المحتوى ويكتشف اللغة تلقائياً — عربي أو كردي أو إنجليزي.',
    step3_title: 'احصل على خطة دراستك',
    step3_desc: 'احصل على خطة دراسة كاملة وشرح مفصّل مقسّم إلى أقسام واضحة واختبار من 5 أسئلة بمستويات مختلفة.',
    feat_title: 'مصمّم للطلاب الجادّين',
    feat_sub: 'كل ميزة مصمّمة لمساعدتك على الفهم — لا مجرد الحفظ.',
    f1_title: '3 لغات مدعومة بالكامل',
    f1_desc: 'العربية وKurdish وInglish — تُكتشف تلقائياً من صورتك. لا حاجة لأي تبديل.',
    f2_title: 'شروحات عميقة',
    f2_desc: 'كل نتيجة تتضمن: المفهوم الأساسي، المبادئ الرئيسية مع الأمثلة، الأخطاء الشائعة، التطبيقات الواقعية، ونصيحة للحفظ.',
    f3_title: 'اختبار تكيّفي بمستويات صعوبة',
    f3_desc: '5 أسئلة لكل موضوع — سؤالان سهلان (استرجاع)، سؤالان متوسطان (فهم)، سؤال صعب (تحليل). كل إجابة خاطئة تُشرح بالتفصيل.',
    f4_title: 'سجلّ دراستك الكامل',
    f4_desc: 'كل خطة دراسة أنشأتها محفوظة. ابحث في سجلّك وراجع أي موضوع في أي وقت.',
    f5_title: 'نسخ ومشاركة فورية',
    f5_desc: 'بضغطة واحدة انسخ خطة دراستك الكاملة. شاركها على واتساب أو تيليغرام أو احفظها في ملاحظاتك.',
    f6_title: 'يعمل على أي هاتف',
    f6_desc: 'مصمّم للجوّال. صوّر في الصف أو الباص أو البيت — خطة دراستك جاهزة قبل أن تضع هاتفك.',
    subjects_title: 'يعمل مع جميع المواد',
    subjects: ['الأحياء', 'الكيمياء', 'الفيزياء', 'الرياضيات', 'التاريخ', 'الجغرافيا', 'الأدب العربي', 'التربية الإسلامية', 'الحاسوب', 'الاقتصاد', 'علم الاجتماع', 'اللغة الإنجليزية'],
    price_title: 'أسعار بسيطة وعادلة',
    price_sub: 'ابدأ مجاناً. ارقَّ فقط عندما تحتاج المزيد.',
    plan1_name: 'مجاني',
    plan1_price: '$0',
    plan1_period: 'للأبد',
    plan1_desc: 'مثالي للتجربة',
    plan1_f1: 'رفعان يومياً',
    plan1_f2: '6 رفعات شهرياً',
    plan1_f3: 'خطة دراسة كاملة + اختبار',
    plan1_f4: 'عربي، كردي وإنجليزي',
    plan1_cta: 'ابدأ مجاناً',
    plan2_name: 'فتح واحد',
    plan2_badge: 'الأكثر شعبية',
    plan2_price: '$0.99',
    plan2_period: 'لكل رفع إضافي',
    plan2_desc: 'ادفع فقط عندما تحتاج المزيد',
    plan2_f1: 'رفع إضافي واحد — لا ينتهي',
    plan2_f2: 'بدون اشتراك',
    plan2_f3: 'الدفع عبر ZainCash أو واتساب',
    plan2_f4: 'جميع مميزات الخطة المجانية',
    plan2_cta: 'احصل على رفع إضافي',
    plan3_name: 'برو شهري',
    plan3_price: '$10',
    plan3_period: 'شهرياً',
    plan3_desc: 'للطلاب الذين يدرسون يومياً',
    plan3_f1: '60 رفعة شهرياً',
    plan3_f2: 'بدون حدّ يومي',
    plan3_f3: 'جميع المميزات مفتوحة',
    plan3_f4: 'إلغاء في أي وقت',
    plan3_cta: 'اشترك بالبرو',
    faq_title: 'الأسئلة الشائعة',
    faqs: [
      { q: 'هل أحتاج إلى إنشاء حساب؟', a: 'لا. فقط أدخل رقم هاتفك وبريدك الإلكتروني عند الرفع. لا كلمة مرور، لا استمارة تسجيل — فقط ابدأ.' },
      { q: 'ما المواد التي يعمل معها؟', a: 'أي مادة تحتوي على نصوص أو مخططات. أحياء، كيمياء، فيزياء، تاريخ، جغرافيا، رياضيات، حاسوب، تربية إسلامية، أدب — إذا كان مكتوباً على ورقة أو شريحة، فهو يعمل.' },
      { q: 'كم يستغرق من الوقت؟', a: 'عادةً 15-30 ثانية للحصول على خطة دراسة كاملة وشرح واختبار. وأحياناً تصل إلى 60 ثانية للمحتوى المعقّد.' },
      { q: 'هل يقرأ النصوص العربية في الصورة فعلاً؟', a: 'نعم. يقرأ الذكاء الاصطناعي النصوص بالعربية والكردية السورانية والإنجليزية مباشرةً من صورتك، ويكتشف اللغة تلقائياً ويجيبك بنفس اللغة.' },
      { q: 'ماذا لو نفدت رفعاتي المجانية؟', a: 'تواصل معنا عبر واتساب للدفع وستصلك شفرة فتح فوراً. ندعم ZainCash وFIB وVisa/Mastercard والتحويل البنكي.' },
      { q: 'هل بياناتي خاصة؟', a: 'نعم. صورك وخطط دراستك محفوظة بأمان ولا يمكن الوصول إليها إلا برقم هاتفك وبريدك الإلكتروني. لا نشارك بياناتك مطلقاً.' },
    ],
    cta_title: 'ابدأ الدراسة بذكاء اليوم',
    cta_sub: 'مجاني للبدء. بدون تسجيل. يعمل على أي هاتف.',
    cta_btn: 'ارفع صورتك الأولى ←',
    footer_copy: '© 2024 StudyAI · مدعوم بـ Claude AI · مصنوع لطلاب العراق والشرق الأوسط',
  },

  ku: {
    dir: 'rtl' as const,
    nav_how: 'چۆن کار دەکات',
    nav_features: 'تایبەتمەندییەکان',
    nav_pricing: 'نرخەکان',
    nav_faq: 'پرسیارە باوەکان',
    nav_cta: 'بەخۆڕایی تاقی بکەرەوە',
    hero_tag: '✨ بە عەرەبی، کوردی و ئینگلیزی کار دەکات',
    hero_h1: 'هەر وێنەیەک لە کتێبەکەت بگوردە پلانی خوێندنەوەی تەواو',
    hero_sub: 'وێنەی هەر پەڕەیەک لە کتێبەکەت یان تێبینییەکانت بکە. پلانی خوێندنەوەی ریکخراو و ڕوونکردنەوەی پسپۆڕانە و تاقیکردنەوەی گونجاو وەردەگریت — لە ٣٠ چرکەدا. مامۆستای تایبەتی زیرەکت، ٢٤ کاتژمێر ئامادەیە.',
    hero_cta: 'بەخۆڕایی دەست پێبکە — تۆمارکردن پێویست نییە',
    hero_secondary: '↓ ببینە چۆن کار دەکات',
    hero_trust1: 'دروستکردنی ئەکاونت پێویست نییە',
    hero_trust2: 'بەخۆڕایی دەست پێبکە',
    hero_trust3: 'لەسەر هەر مۆبایلێک کار دەکات',
    hero_trust4: '١٠٠٪ پارێزراو',
    preview_title: 'ئەوەی دوای هەر بارکردنێک وەردەگریت',
    preview_1_title: 'پلانی خوێندنەوەی ریکخراو',
    preview_1_desc: 'پلانی ٧ هەنگاو کە ڕاستەوخۆ دەڵێت چی بخوێنیتەوە و بۆچی',
    preview_2_title: 'ڕوونکردنەوەی پسپۆڕانە',
    preview_2_desc: 'تێڕوانینی سەرەکی · ئەصلی سەرەکییەکان · ھەڵەی باو · ئیپووی بیرخستنەوە',
    preview_3_title: 'تاقیکردنەوەی پلەبەندیکراو',
    preview_3_desc: '٥ پرسیار لە ئاستی ئاسان، ناوەڕاست و سەخت — لەگەڵ ڕوونکردنەوەی تەواو',
    how_title: 'سێ هەنگاو. سی چرکە.',
    how_sub: 'ڕێکخستن نییە. ئەکاونت نییە. تەنها ئەنجام.',
    step1_title: 'وێنە بکە',
    step1_desc: 'وێنەیەکی ڕوون لە هەر پەڕەیەک لە کتێبی خوێندنەوەکەت یان تێبینییەکانت یان کاغەزی تاقیکردنەوە بکە. هەر مادەیەک. هەر ئاستێک.',
    step2_title: 'زیرەکی دەستکرد شیکاری دەکات',
    step2_desc: 'زیرەکی دەستکرد ناوەڕۆکەکە دەخوێنێتەوە و زمانەکە بە خۆماوە دەناسێت — عەرەبی، کوردی، یان ئینگلیزی.',
    step3_title: 'پلانی خوێندنەوەکەت وەربگرە',
    step3_desc: 'پلانی خوێندنەوەی تەواو و ڕوونکردنەوەی ورد دابەشکراو بە بەشە ئاشکراکان و تاقیکردنەوەی ٥ پرسیار لەگەڵ ئاستی جیاواز وەردەگریت.',
    feat_title: 'دروستکراوە بۆ قوتابییە جددییەکان',
    feat_sub: 'هەر تایبەتمەندییەک دروستکراوە بۆ ئەوەی یارمەتیت بدات تێبگەیت — نەک تەنها لەبەریت بکەیت.',
    f1_title: '٣ زمان بە تەواوی پشتیوانیکراون',
    f1_desc: 'عەرەبی و کوردی و ئینگلیزی — بە خۆماوە لە وێنەکەت دەناسرێت. پێویستی بە گۆڕین نییە.',
    f2_title: 'ڕوونکردنەوەی قووڵ',
    f2_desc: 'هەر ئەنجامێک ئەمانەی لەخۆ دەگرێت: تێڕوانینی سەرەکی، ئەصلی سەرەکییەکان لەگەڵ نموونەکان، ھەڵەی باو، جێبەجێکردنی ڕاستەقینە، و ئیپووی بیرخستنەوە.',
    f3_title: 'تاقیکردنەوەی گونجاو لەگەڵ ئاستی سەختی',
    f3_desc: '٥ پرسیار بۆ هەر بابەتێک — ٢ ئاسان (بیرهێنانەوە)، ٢ ناوەڕاست (تێگەیشتن)، ١ سەخت (شیکاری). هەر وەڵامێکی ھەڵە بە تەواو ڕوون دەکرێتەوە.',
    f4_title: 'مێژووی خوێندنەوەی تەواوت',
    f4_desc: 'هەر پلانی خوێندنەوەیەک کە دروستت کردووە پاشکەوتکراوە. مێژووەکەت بگەڕێ و هەر بابەتێک لە هەر کاتێکدا دووبارە بینە.',
    f5_title: 'کۆپیکردن و هاوبەشکردنی ڕیکخراو',
    f5_desc: 'بەیەک لێدانەوە پلانی خوێندنەوەی تەواوت کۆپی بکە. بیبینەرە واتساپ یان تێلێگرام یان تێبینییەکانت.',
    f6_title: 'لەسەر هەر مۆبایلێک کار دەکات',
    f6_desc: 'دروستکراوە بۆ مۆبایل. لە پۆلەکە، لە بووس، لە ماڵ وێنە بکە — پلانی خوێندنەوەکەت ئامادەیە پێش ئەوەی مۆبایلەکەت دابنێیت.',
    subjects_title: 'لەگەڵ هەموو مادەیەک کار دەکات',
    subjects: ['بایەلۆجی', 'کیمیا', 'فیزیا', 'بیرکاری', 'مێژوو', 'جوگرافیا', 'ئەدەبی عەرەبی', 'خوێندنی ئیسلامی', 'کۆمپیوتەر', 'ئابووری', 'کۆمەڵناسی', 'ئینگلیزی'],
    price_title: 'نرخی سادە و دادپەروەرانە',
    price_sub: 'بەخۆڕایی دەست پێبکە. تەنها کاتێک پێویستت بیت زیادی بکە.',
    plan1_name: 'خۆڕایی',
    plan1_price: '$0',
    plan1_period: 'بۆ هەمیشە',
    plan1_desc: 'گونجاوە بۆ تاقیکردنەوە',
    plan1_f1: '٢ بارکردن ڕۆژانە',
    plan1_f2: '٦ بارکردن مانگانە',
    plan1_f3: 'پلانی خوێندنەوەی تەواو + تاقیکردنەوە',
    plan1_f4: 'عەرەبی، کوردی و ئینگلیزی',
    plan1_cta: 'بەخۆڕایی دەست پێبکە',
    plan2_name: 'کردنەوەی یەک جار',
    plan2_badge: 'باشترین هەڵبژاردە',
    plan2_price: '$0.99',
    plan2_period: 'بۆ هەر بارکردنی زیادە',
    plan2_desc: 'تەنها کاتێک پێویستت بیت بدە',
    plan2_f1: '١ بارکردنی زیادە — ماوە نییە',
    plan2_f2: 'بەبێ بەشداریکردن',
    plan2_f3: 'پارەدان لە ڕێگای ZainCash یان واتساپ',
    plan2_f4: 'هەموو تایبەتمەندییەکانی خۆڕایی',
    plan2_cta: 'بارکردنی زیادە وەربگرە',
    plan3_name: 'پڕۆی مانگانە',
    plan3_price: '$10',
    plan3_period: 'مانگانە',
    plan3_desc: 'بۆ قوتابییانێک کە ڕۆژانە دەیخوێننەوە',
    plan3_f1: '٦٠ بارکردن مانگانە',
    plan3_f2: 'سنووری ڕۆژانە نییە',
    plan3_f3: 'هەموو تایبەتمەندییەکان کراونەتەوە',
    plan3_f4: 'هەر کاتێک هەڵبوەشێنەرەوە',
    plan3_cta: 'پڕۆ بکەرەوە',
    faq_title: 'پرسیارە باوەکان',
    faqs: [
      { q: 'پێویستم بە دروستکردنی ئەکاونت هەیە؟', a: 'نەخێر. تەنها ژمارەی تەلەفۆنت و ئیمەیڵەکەت داخڵ بکە کاتێک بارت دەکەیت. نە پاسوۆرد، نە فۆرمی تۆمارکردن — تەنها دەست پێبکە.' },
      { q: 'لەگەڵ چ مادەیەک کار دەکات؟', a: 'هەر مادەیەک کە نووسین یان خەریتەی تێدایە. بایەلۆجی، کیمیا، فیزیا، مێژوو، جوگرافیا، بیرکاری، کۆمپیوتەر، خوێندنی ئیسلامی، ئەدەب — ئەگەر لەسەر کاغەز یان سلایدێک نووسراوە، کار دەکات.' },
      { q: 'چەند کاتێک دەخایەنێت؟', a: 'زۆرجار ١٥-٣٠ چرکە بۆ پلانی خوێندنەوەی تەواو، ڕوونکردنەوە و تاقیکردنەوە. کەرتێک بۆ ناوەڕۆکی ئاڵۆز تا ٦٠ چرکە دەگات.' },
      { q: 'ئایا ڕاستەوخۆ دەنووسراوی کوردی لە وێنەکەدا دەخوێنێتەوە؟', a: 'بەڵێ. زیرەکی دەستکرد نووسینی عەرەبی و کوردیی سۆرانی و ئینگلیزی ڕاستەوخۆ لە وێنەکەت دەخوێنێتەوە و زمانەکە بە خۆماوە دەناسێت و بە هەمان زمان وەڵامت دەداتەوە.' },
      { q: 'ئەگەر بارکردنی خۆڕایم تەواو بووبێت چ دەکەم؟', a: 'لە ڕێگای واتساپ پەیوەندیمان پێوە بکە بۆ پارەدان و ئینپووتی کردنەوەیەکت دەگات. پشتیوانی ZainCash و FIB و Visa/Mastercard و گواستنەوەی بانکی دەکەین.' },
      { q: 'داتاکانم تایبەتن؟', a: 'بەڵێ. وێنەکانت و پلانەکانت بە ئارامی پاشکەوتکراون و تەنها لە ڕێگای ژمارەی تەلەفۆنت و ئیمەیڵەکەتەوە دەتوانرێت بەردەستی بکرێن. هەرگیز داتاکانت هاوبەش ناکەین.' },
    ],
    cta_title: 'ئەمڕۆ بە زیرەکی خوێندنەوە دەست پێبکە',
    cta_sub: 'بەخۆڕایی دەست پێبکە. تۆمارکردن نەویستە. لەسەر هەر مۆبایلێک کار دەکات.',
    cta_btn: 'یەکەم وێنەکەت بباردە ←',
    footer_copy: '© 2024 StudyAI · بەهێزکراوە بە Claude AI · دروستکراوە بۆ قوتابییانی عێراق و ناوچەی خاوەرمیانە',
  },
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const t = T[lang]

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <div dir={t.dir} className="min-h-screen bg-white text-gray-900">

      {/* ── STICKY NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎓</span>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">StudyAI</span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#how" className="hover:text-gray-900 transition">{t.nav_how}</a>
            <a href="#features" className="hover:text-gray-900 transition">{t.nav_features}</a>
            <a href="#pricing" className="hover:text-gray-900 transition">{t.nav_pricing}</a>
            <a href="#faq" className="hover:text-gray-900 transition">{t.nav_faq}</a>
          </div>

          {/* Right side: language toggle + CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(['en', 'ar', 'ku'] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    lang === l ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'ar' ? 'عربي' : 'کوردی'}
                </button>
              ))}
            </div>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm"
              >
                {lang === 'ar' ? 'لوحتي ←' : lang === 'ku' ? 'داشبۆردەکەم ←' : 'My Dashboard →'}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block font-medium"
                >
                  {lang === 'ar' ? 'تسجيل الدخول' : lang === 'ku' ? 'چوونەژوورەوە' : 'Sign In'}
                </Link>
                <Link
                  href="/upload"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm"
                >
                  {t.nav_cta}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-16 pb-20 px-4 sm:px-6">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-blue-200">
            {t.hero_tag}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            {lang === 'en' ? (
              <>Turn Any Textbook Photo<br className="hidden sm:block" /> Into a <span className="text-blue-600">Complete Study Plan</span></>
            ) : lang === 'ar' ? (
              <>حوّل أي صورة من كتابك<br className="hidden sm:block" /> إلى <span className="text-blue-600">خطة دراسية متكاملة</span></>
            ) : (
              <>هەر وێنەیەک لە کتێبەکەت<br className="hidden sm:block" /> بگوردە <span className="text-blue-600">پلانی خوێندنەوەی تەواو</span></>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.hero_sub}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                {lang === 'ar' ? '← الذهاب إلى لوحتي' : lang === 'ku' ? '← داشبۆردەکەم' : 'Go to My Dashboard →'}
              </Link>
            ) : (
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t.hero_cta}
              </Link>
            )}
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-8 py-4 rounded-xl text-lg transition hover:bg-gray-50"
            >
              {t.hero_secondary}
            </a>
          </div>

          {!isLoggedIn && (
            <p className="text-sm text-gray-400 mb-4">
              Already a student?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                {lang === 'ar' ? 'سجّل دخولك' : lang === 'ku' ? 'بچۆ ژوورەوە' : 'Sign in to your dashboard'}
              </Link>
            </p>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            {[t.hero_trust1, t.hero_trust2, t.hero_trust3, t.hero_trust4].map((badge, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET PREVIEW ── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest text-center mb-8">
            {t.preview_title}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📝', title: t.preview_1_title, desc: t.preview_1_desc },
              { icon: '💡', title: t.preview_2_title, desc: t.preview_2_desc },
              { icon: '✅', title: t.preview_3_title, desc: t.preview_3_desc },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-white">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{t.how_title}</h2>
            <p className="text-gray-500 text-lg">{t.how_sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-blue-200 z-0" />
            {[
              { n: '1', icon: '📷', title: t.step1_title, desc: t.step1_desc },
              { n: '2', icon: '🤖', title: t.step2_title, desc: t.step2_desc },
              { n: '3', icon: '📚', title: t.step3_title, desc: t.step3_desc },
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-white rounded-2xl p-7 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-extrabold text-xl mx-auto mb-4 shadow-lg shadow-blue-200">
                  {step.n}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{t.feat_title}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t.feat_sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🌍', title: t.f1_title, desc: t.f1_desc },
              { icon: '💡', title: t.f2_title, desc: t.f2_desc },
              { icon: '🧠', title: t.f3_title, desc: t.f3_desc },
              { icon: '📂', title: t.f4_title, desc: t.f4_desc },
              { icon: '📋', title: t.f5_title, desc: t.f5_desc },
              { icon: '📱', title: t.f6_title, desc: t.f6_desc },
            ].map((f, i) => (
              <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-200">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBJECTS ── */}
      <section className="bg-gray-50 py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.subjects_title}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {t.subjects.map((s, i) => (
              <span key={i} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:border-blue-300 hover:text-blue-700 transition cursor-default">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{t.price_title}</h2>
            <p className="text-gray-500 text-lg">{t.price_sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Free */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-7 shadow-sm">
              <p className="text-2xl mb-3">🆓</p>
              <p className="font-bold text-gray-900 text-lg mb-0.5">{t.plan1_name}</p>
              <p className="text-gray-400 text-sm mb-4">{t.plan1_desc}</p>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-gray-900">{t.plan1_price}</span>
                <span className="text-gray-400 text-sm ml-2">{t.plan1_period}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {[t.plan1_f1, t.plan1_f2, t.plan1_f3, t.plan1_f4].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/upload" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition">
                {t.plan1_cta}
              </Link>
            </div>

            {/* Single — highlighted */}
            <div className="relative bg-blue-600 rounded-2xl p-7 shadow-xl shadow-blue-200">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                {t.plan2_badge}
              </div>
              <p className="text-2xl mb-3">⚡</p>
              <p className="font-bold text-white text-lg mb-0.5">{t.plan2_name}</p>
              <p className="text-blue-200 text-sm mb-4">{t.plan2_desc}</p>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-white">{t.plan2_price}</span>
                <span className="text-blue-300 text-sm ml-2">{t.plan2_period}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {[t.plan2_f1, t.plan2_f2, t.plan2_f3, t.plan2_f4].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-100">
                    <span className="text-blue-300 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/unlock" className="block w-full text-center bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 rounded-xl transition shadow-md">
                {t.plan2_cta}
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-7 shadow-sm">
              <p className="text-2xl mb-3">👑</p>
              <p className="font-bold text-gray-900 text-lg mb-0.5">{t.plan3_name}</p>
              <p className="text-gray-400 text-sm mb-4">{t.plan3_desc}</p>
              <div className="mb-5">
                <span className="text-4xl font-extrabold text-gray-900">{t.plan3_price}</span>
                <span className="text-gray-400 text-sm ml-2">{t.plan3_period}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {[t.plan3_f1, t.plan3_f2, t.plan3_f3, t.plan3_f4].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/unlock" className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition">
                {t.plan3_cta}
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">{t.faq_title}</h2>
          <div className="space-y-3">
            {t.faqs.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 text-sm leading-relaxed">{item.q}</span>
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t.cta_title}</h2>
          <p className="text-blue-200 text-lg mb-8">{t.cta_sub}</p>
          <Link
            href="/upload"
            className="inline-block bg-white text-blue-700 font-extrabold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition shadow-xl hover:-translate-y-0.5"
          >
            {t.cta_btn}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6 text-center text-sm text-gray-400">
        <div className="flex flex-wrap justify-center gap-4 mb-3 text-gray-500">
          <Link href="/upload" className="hover:text-gray-900 transition">
            {lang === 'en' ? 'Upload' : lang === 'ar' ? 'رفع' : 'بارکردن'}
          </Link>
          <Link href={isLoggedIn ? '/dashboard' : '/login'} className="hover:text-gray-900 transition">
            {lang === 'en' ? (isLoggedIn ? 'Dashboard' : 'Sign In') : lang === 'ar' ? (isLoggedIn ? 'لوحتي' : 'تسجيل الدخول') : (isLoggedIn ? 'داشبۆرد' : 'چوونەژوورەوە')}
          </Link>
          <Link href="/pricing" className="hover:text-gray-900 transition">
            {lang === 'en' ? 'Pricing' : lang === 'ar' ? 'الأسعار' : 'نرخەکان'}
          </Link>
          <Link href="/unlock" className="hover:text-gray-900 transition">
            {lang === 'en' ? 'Unlock' : lang === 'ar' ? 'فتح الحساب' : 'کردنەوە'}
          </Link>
        </div>
        <p>{t.footer_copy}</p>
      </footer>

    </div>
  )
}
