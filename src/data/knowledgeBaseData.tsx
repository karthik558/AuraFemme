import { Heart, Baby, Stethoscope, Activity, Info, BookOpen, List } from 'lucide-react';

export const KNOWLEDGE_TOPICS = [
  {
    id: 'pregnancy',
    title: 'Pregnancy',
    icon: <Heart className="w-7 h-7" />,
    content: 'Comprehensive clinical insights into the trimesters of pregnancy. Monitor physiological shifts, hormonal baselines, and essential nutritional requirements as the body adapts to gestation.',
    
  },
  {
    id: 'before-you-get-pregnant',
    title: 'Before you get pregnant',
    icon: <Baby className="w-7 h-7" />,
    content: 'Preconception health involves optimizing your biometric baselines. Learn about ovulation tracking, basal body temperature, folic acid supplementation, and evaluating lifestyle factors to build a healthy foundation.',
    
  },
  {
    id: 'youre-pregnant-now-what',
    title: "You're pregnant: Now what?",
    icon: <Stethoscope className="w-7 h-7" />,
    content: 'The first trimester initiates rapid endocrine changes. Schedule your initial obstetric consultation, transition to prenatal vitamins, and familiarize yourself with early pregnancy symptoms such as morning sickness and fatigue.',
    
  },
  {
    id: 'getting-ready-for-baby',
    title: 'Getting ready for baby',
    icon: <Baby className="w-7 h-7" />,
    content: 'Practical preparation for childbirth. This includes drafting a birth plan, establishing a clinical support network, setting up the nursery environment, and understanding the physical demands of labor and postpartum recovery.',
    
  },
  {
    id: 'childbirth-and-beyond',
    title: 'Childbirth and beyond',
    icon: <Activity className="w-7 h-7" />,
    content: 'An overview of the stages of labor, pain management protocols, and postpartum physiological rehabilitation (the "fourth trimester"). Focuses on pelvic floor health, lactation consultation, and hormonal recalibration.',
    
  },
  {
    id: 'features-and-fact-sheets',
    title: 'Features and fact sheets',
    icon: <Info className="w-7 h-7" />,
    content: 'Aura Femme integrates deeply with clinical data. Review our peer-reviewed fact sheets on topics like polycystic ovary syndrome (PCOS), endometriosis, thyroid function, and irregular menstrual cycles.',
    
  },
  {
    id: 'ovulation-calculator',
    title: 'Ovulation calculator',
    icon: <BookOpen className="w-7 h-7" />,
    content: 'Aura Femme features a predictive algorithm that identifies your most fertile days. By combining cycle length, luteal phase constants, and historical data, the safety analyzer minimizes risk and maximizes conception probability.',
    
  },
  {
    id: 'view-a-z-health-topics',
    title: 'View A-Z health topics',
    icon: <List className="w-7 h-7" />,
    content: 'Browse our complete directory of gynecological and obstetric health topics. From Adenomyosis to Zygote development, access evidence-based literature and clinical glossaries.',
    
  }
];
