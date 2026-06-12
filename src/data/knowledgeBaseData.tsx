import { Heart, Baby, Stethoscope, Activity, Info, BookOpen, List } from 'lucide-react';

export const KNOWLEDGE_TOPICS = [
  {
    id: 'pregnancy',
    title: 'Pregnancy',
    icon: <Heart className="w-7 h-7" />,
    content: 'Comprehensive clinical insights into the trimesters of pregnancy. Monitor physiological shifts, hormonal baselines, and essential nutritional requirements as the body adapts to gestation.',
    articleContent: {
      intro: 'Pregnancy encompasses three distinct trimesters, each defined by unique fetal developmental milestones and corresponding maternal physiological adaptations. Early awareness of these changes promotes optimal maternal-fetal outcomes.',
      body: [
        {
          title: 'First Trimester (Weeks 1-13)',
          text: 'The first trimester is characterized by rapid embryonic organogenesis. High levels of Human Chorionic Gonadotropin (hCG) and surging progesterone often cause nausea, fatigue, and breast tenderness. The neural tube forms by week 6, making early folic acid supplementation critical to prevent defects.'
        },
        {
          title: 'Second Trimester (Weeks 14-27)',
          text: 'Often termed the "honeymoon phase," hCG levels stabilize, usually resolving early nausea. Fetal movements (quickening) typically begin between 16-20 weeks. Physiologically, blood volume increases by up to 50%, requiring increased iron intake to prevent maternal anemia.'
        },
        {
          title: 'Third Trimester (Weeks 28-40+)',
          text: 'Fetal adipose tissue accumulation accelerates. The uterus expands significantly, applying pressure to the diaphragm and bladder. Monitoring fetal kick counts becomes essential, and clinical surveillance increases to identify risks like preeclampsia or gestational diabetes.'
        }
      ],
      showGraph: true,
      graphTitle: 'Endocrine Modeling: Early Gestation',
      graphDesc: 'The endocrine model during early gestation reveals a sharp, sustained spike in Human Chorionic Gonadotropin (hCG) alongside steady estrogen and progesterone scaling to support the uterine lining.',
      actionItems: [
        'Initiate a daily regimen of prenatal vitamins containing at least 400mcg of folic acid (Source: ACOG).',
        'Schedule your first obstetric ultrasound between 8 and 10 weeks gestation to verify viability and date the pregnancy.',
        'Monitor and report any sudden spotting or severe cramping to your clinical provider immediately.'
      ],
      externalLinks: [
        { title: 'Pregnancy', url: 'https://womenshealth.gov/pregnancy' }
      ]
    }
  },
  {
    id: 'before-pregnant',
    title: 'Before you get pregnant',
    icon: <Baby className="w-7 h-7" />,
    content: 'Preconception health involves optimizing your biometric baselines. Learn about ovulation tracking, basal body temperature, folic acid supplementation, and evaluating lifestyle factors to build a healthy foundation.',
    articleContent: {
      intro: 'Preconception care focuses on identifying and modifying biomedical, behavioral, and social risks to a woman’s health or pregnancy outcome through prevention and management. The American College of Obstetricians and Gynecologists (ACOG) recommends developing a Reproductive Life Plan.',
      body: [
        {
          title: 'Medical Conditions & Medications',
          text: 'Chronic diseases such as diabetes, hypertension, and thyroid disorders must be strictly managed prior to conception. High blood sugar during early embryogenesis significantly increases the risk of congenital anomalies. Furthermore, current prescriptions must be audited for teratogenic risks.'
        },
        {
          title: 'Biometric Optimization',
          text: 'Achieving a healthy Body Mass Index (BMI) prior to conception reduces the risk of ovulatory dysfunction, gestational diabetes, and hypertensive disorders of pregnancy. Both extremes of BMI (underweight and obese) can negatively impact fertility and fetal development.'
        },
        {
          title: 'Environmental & Lifestyle Modifications',
          text: 'Immediate cessation of tobacco, illicit drugs, and alcohol is recommended, as there is no safe threshold for alcohol consumption during early gestation. Minimizing exposure to endocrine disruptors (like certain plastics and harsh chemicals) is also advised.'
        }
      ],
      showGraph: true,
      graphTitle: 'Baseline Biometrics & Cycle Mapping',
      graphDesc: 'Tracking resting heart rate (RHR) and basal body temperature (BBT) establishes a reliable baseline. The graph below models a standard ovulatory cycle to help identify peak fertility windows prior to conception efforts.',
      actionItems: [
        'Discontinue hormonal contraceptives and track at least two natural cycles to establish your baseline luteal phase.',
        'Schedule a preconception screening panel, including rubella immunity, varicella, and thyroid function (TSH).',
        'Begin tracking cervical mucus consistency, noting the transition to a "raw egg white" texture which signals peak fertility.'
      ],
      externalLinks: [
        { title: 'Creating a reproductive life plan', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant' },
        { title: 'Why birth control is important', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant' },
        { title: 'Preconception health', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant/preconception-health' },
        { title: 'Trying to conceive', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant/trying-conceive' },
        { title: 'Knowing if you are pregnant', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant/knowing-if-you-are-pregnant' },
        { title: 'Unplanned pregnancy', url: 'https://womenshealth.gov/pregnancy/you-get-pregnant' }
      ]
    }
  },
  {
    id: 'now-what',
    title: "You're pregnant: Now what?",
    icon: <Stethoscope className="w-7 h-7" />,
    content: 'The first trimester initiates rapid endocrine changes. Schedule your initial obstetric consultation, transition to prenatal vitamins, and familiarize yourself with early pregnancy symptoms such as morning sickness and fatigue.',
    articleContent: {
      intro: 'Confirming a pregnancy triggers a cascade of necessary medical and lifestyle adjustments. The first 12 weeks are a critical period for embryonic organogenesis, requiring immediate protective measures.',
      body: [
        {
          title: 'Clinical Confirmation & Dating',
          text: 'A positive home urine test should be followed by a serum beta-hCG blood test or a transvaginal ultrasound. Establishing an accurate Estimated Date of Delivery (EDD) early on is crucial for timing future genetic screenings and assessing fetal growth.'
        },
        {
          title: 'Dietary Restrictions',
          text: 'To prevent listeriosis and toxoplasmosis, immediately eliminate raw or undercooked meats, unpasteurized dairy products, deli meats (unless heated to steaming), and high-mercury fish (like shark, swordfish, and king mackerel) from your diet.'
        },
        {
          title: 'Managing Early Symptoms',
          text: 'Nausea and vomiting of pregnancy (NVP) affects up to 80% of pregnant women. Eating small, frequent meals high in complex carbohydrates and protein can stabilize blood sugar. In severe cases (hyperemesis gravidarum), clinical intervention for hydration may be necessary.'
        }
      ],
      showGraph: false,
      graphTitle: '',
      graphDesc: '',
      actionItems: [
        'Select an Obstetrician or Certified Nurse Midwife (CNM) and schedule your intake appointment.',
        'Audit your current medications with a pharmacist or OBGYN to ensure they are safe for fetal development.',
        'Limit caffeine intake to less than 200mg per day (roughly one 12oz cup of coffee).'
      ],
      externalLinks: [
        { title: 'Stages of pregnancy', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'First trimester', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Second trimester', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Third trimester', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Prenatal care and tests', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Prenatal checkups', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Common prenatal tests', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Twins, triplets, and other multiples', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'How twins are formed', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Pregnancy with multiples', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Staying healthy and safe', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what/staying-healthy-and-safe' },
        { title: 'Eating for two', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Using medicine and herbs', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Pregnancy complications', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Health problems during pregnancy', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Health problems before pregnancy', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Body changes and discomforts', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Breast changes', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Morning sickness', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Pregnancy loss', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' },
        { title: 'Know your pregnancy rights', url: 'https://womenshealth.gov/pregnancy/youre-pregnant-now-what' }
      ]
    }
  },
  {
    id: 'getting-ready',
    title: 'Getting ready for baby',
    icon: <Baby className="w-7 h-7" />,
    content: 'Practical preparation for childbirth. This includes drafting a birth plan, establishing a clinical support network, setting up the nursery environment, and understanding the physical demands of labor and postpartum recovery.',
    articleContent: {
      intro: 'The third trimester requires transitioning from pregnancy maintenance to labor preparation. This involves both physical readiness and logistical planning for the immediate postpartum period.',
      body: [
        {
          title: 'Birth Planning & Advocacy',
          text: 'A birth plan outlines your preferences for labor, including pain management (e.g., epidural vs. unmedicated), fetal monitoring techniques, and interventions (episiotomy, vacuum extraction). However, clinical flexibility is vital if medical emergencies arise.'
        },
        {
          title: 'Pediatric Care Selection',
          text: 'Infants require examination within 48-72 hours of hospital discharge. Interviewing and securing a board-certified pediatrician during the third trimester ensures a smooth transition of care for the neonate.'
        },
        {
          title: 'Nursery Safety Standards',
          text: 'To minimize the risk of Sudden Infant Death Syndrome (SIDS), sleep environments must adhere to AAP guidelines: a firm mattress, no loose bedding, bumpers, or stuffed animals. The infant should be placed supine (on their back) to sleep.'
        }
      ],
      showGraph: false,
      graphTitle: '',
      graphDesc: '',
      actionItems: [
        'Finalize your birth plan and review it with your attending clinical team to align expectations.',
        'Install and inspect the infant car seat (consult local certified technicians if necessary; hospitals require this before discharge).',
        'Prepare a postpartum recovery kit including perineal ice packs, witch hazel, and high-absorbency pads.'
      ],
      externalLinks: [
        { title: 'Health care for baby', url: 'https://womenshealth.gov/pregnancy/getting-ready-baby/health-care-baby' },
        { title: 'Making your home safe for baby', url: 'https://womenshealth.gov/pregnancy/getting-ready-baby/making-your-home-safe-baby' },
        { title: 'Birthing, breastfeeding, and parenting classes', url: 'https://womenshealth.gov/pregnancy/getting-ready-baby/birthing-breastfeeding-and-parenting-classes' },
        { title: 'Last-minute to-dos', url: 'https://womenshealth.gov/pregnancy/getting-ready-baby/last-minute-dos' }
      ]
    }
  },
  {
    id: 'childbirth',
    title: 'Childbirth and beyond',
    icon: <Activity className="w-7 h-7" />,
    content: 'An overview of the stages of labor, pain management protocols, and postpartum physiological rehabilitation (the "fourth trimester"). Focuses on pelvic floor health, lactation consultation, and hormonal recalibration.',
    articleContent: {
      intro: 'Labor is divided into three clinical stages: cervical dilation, fetal expulsion, and placental delivery. The subsequent "fourth trimester" is a profound period of physical healing and psychological transition.',
      body: [
        {
          title: 'The Stages of Labor',
          text: 'Stage 1 involves cervical effacement and dilation up to 10cm, driven by oxytocin-induced contractions. Stage 2 is active pushing resulting in the delivery of the neonate. Stage 3 is the expulsion of the placenta, requiring careful clinical monitoring for postpartum hemorrhage.'
        },
        {
          title: 'The "Fourth Trimester" & Endocrine Crash',
          text: 'Following placental delivery, maternal estrogen and progesterone levels plummet abruptly. This sudden endocrine shift, combined with sleep deprivation, makes the first 6 weeks a high-risk period for Postpartum Depression (PPD) and anxiety.'
        },
        {
          title: 'Pelvic Floor Rehabilitation',
          text: 'Vaginal delivery stretches the levator ani muscles. Engaging in pelvic floor physical therapy can mitigate risks of urinary incontinence and pelvic organ prolapse. Healing from perineal tearing or an episiotomy typically takes 4-6 weeks.'
        }
      ],
      showGraph: false,
      graphTitle: '',
      graphDesc: '',
      actionItems: [
        'Monitor lochia (postpartum bleeding) volume; saturation of a pad in under an hour requires immediate medical attention.',
        'Familiarize yourself with the Edinburgh Postnatal Depression Scale (EPDS) to self-monitor for PPD symptoms.',
        'Utilize board-certified lactation consultants early if experiencing latch difficulties or nipple trauma.'
      ],
      externalLinks: [
        { title: 'Labor and birth', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/labor-and-birth' },
        { title: 'Your baby\'s first hours of life', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/your-babys-first-hours-life' },
        { title: 'Recovering from birth', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/recovering-birth' },
        { title: 'Newborn care and safety', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/newborn-care-and-safety' },
        { title: 'Getting pregnant again', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/getting-pregnant-again' },
        { title: 'Babysitters and child care', url: 'https://womenshealth.gov/pregnancy/childbirth-and-beyond/babysitters-and-child-care' }
      ]
    }
  },
  {
    id: 'fact-sheets',
    title: 'Features and fact sheets',
    icon: <Info className="w-7 h-7" />,
    content: 'Aura Femme integrates deeply with clinical data. Review our peer-reviewed fact sheets on topics like polycystic ovary syndrome (PCOS), endometriosis, thyroid function, and irregular menstrual cycles.',
    articleContent: {
      intro: 'Clinical data integrity is the foundation of Aura Femme. Our fact sheets synthesize current peer-reviewed literature into actionable, digestible insights for managing chronic reproductive conditions.',
      body: [
        {
          title: 'Polycystic Ovary Syndrome (PCOS)',
          text: 'An endocrine disorder characterized by hyperandrogenism, ovulatory dysfunction, and polycystic ovarian morphology. It is a leading cause of anovulatory infertility and requires metabolic management (often addressing insulin resistance).'
        },
        {
          title: 'Endometriosis',
          text: 'A chronic inflammatory condition where endometrial-like tissue grows outside the uterine cavity. Hallmarks include severe dysmenorrhea (pelvic pain), dyspareunia (painful intercourse), and subfertility.'
        },
        {
          title: 'Luteal Phase Defect (LPD)',
          text: 'A condition where the ovaries do not produce enough progesterone after ovulation, or the uterine lining doesn’t respond to it properly, leading to an abnormally short luteal phase (< 10 days) and early miscarriage risk.'
        }
      ],
      showGraph: false,
      graphTitle: '',
      graphDesc: '',
      actionItems: [
        'Cross-reference your logged symptom data with our clinical condition markers.',
        'Export your cycle history as a PDF to provide your endocrinologist with hard longitudinal data.',
        'Maintain a consistent logging streak to improve the algorithmic accuracy of anomaly detection.'
      ],
      externalLinks: [
        { title: 'Features and fact sheets', url: 'https://womenshealth.gov/pregnancy/fact-sheets' }
      ]
    }
  },
  {
    id: 'calculator',
    title: 'Ovulation calculator',
    icon: <BookOpen className="w-7 h-7" />,
    content: 'Aura Femme features a predictive algorithm that identifies your most fertile days. By combining cycle length, luteal phase constants, and historical data, the safety analyzer minimizes risk and maximizes conception probability.',
    articleContent: {
      intro: 'Our proprietary algorithm extends beyond simple calendar counting. It utilizes a dynamically adjusting Luteal Phase constant and historical cycle variance to isolate the precise 6-day fertile window.',
      body: [
        {
          title: 'The Sperm Survivability Matrix',
          text: 'Sperm can survive in the female reproductive tract (cervical crypts) for up to 5 days under optimal conditions (presence of fertile cervical mucus). The egg, however, is only viable for 12-24 hours post-ovulation.'
        },
        {
          title: 'Algorithmic Safety Analysis',
          text: 'Aura Femme models theoretical risk by mapping intercourse dates against the projected ovulation window. If an event falls within the 5 days prior to ovulation or the day of, the risk of conception is statistically flagged as elevated.'
        },
        {
          title: 'Limitations of Calendar Methods',
          text: 'Standard rhythm methods assume a fixed 28-day cycle with day 14 ovulation. Because stress, illness, and travel can delay ovulation, Aura relies on live biometric inputs rather than static averages.'
        }
      ],
      showGraph: true,
      graphTitle: 'Clinical Metrics & Probability Modeling',
      graphDesc: 'Understanding the biometrics behind ovulation is critical for optimizing reproductive health. The graph below models the probability density of conception alongside expected basal body temperature (BBT) shifts following the luteal transition.',
      actionItems: [
        'Track daily biometrics: Consistent data entry yields the highest precision in predictive modeling.',
        'Monitor physical symptoms: Objective changes in cervical mucus and resting heart rate are strong secondary indicators.',
        'Synthesize insights: Always use algorithmic predictions in conjunction with physical ovulation predictor kits (OPKs) for maximum accuracy.'
      ],
      externalLinks: [
        { title: 'Ovulation calculator', url: 'https://womenshealth.gov/ovulation-calculator' }
      ]
    }
  },
  {
    id: 'a-z',
    title: 'View A-Z health topics',
    icon: <List className="w-7 h-7" />,
    content: 'Browse our complete directory of gynecological and obstetric health topics. From Adenomyosis to Zygote development, access evidence-based literature and clinical glossaries.',
    articleContent: {
      intro: 'Access our comprehensive medical glossary. We define complex obstetric and gynecological terminology to empower you during clinical consultations, ensuring you can advocate for your own care effectively.',
      body: [
        {
          title: 'A - Adenomyosis',
          text: 'A condition in which endometrial tissue exists within and grows into the uterine wall (myometrium), causing an enlarged uterus, heavy bleeding, and severe pain.'
        },
        {
          title: 'C - Corpus Luteum',
          text: 'The transient endocrine structure that develops from an ovarian follicle after ovulation. It is responsible for producing progesterone to sustain the uterine lining during early pregnancy.'
        },
        {
          title: 'P - Preeclampsia',
          text: 'A serious pregnancy complication characterized by high blood pressure and signs of damage to another organ system, most often the liver and kidneys, typically beginning after 20 weeks of pregnancy.'
        }
      ],
      showGraph: false,
      graphTitle: '',
      graphDesc: '',
      actionItems: [
        'Use this glossary to locate specific pathologies mentioned by your healthcare provider.',
        'Always ask your clinical team for clarification if diagnostic terminology is confusing.',
        'Bookmark complex topics for quick reference during your next clinical visit.'
      ],
      externalLinks: [
        { title: 'View A-Z health topics', url: 'https://womenshealth.gov/a-z-topics' }
      ]
    }
  }
];
