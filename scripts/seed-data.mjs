/* Sample data copied verbatim from the original lcc-evaluation-system.html mockup. */

export const INSTRUCTORS = [
  "Engr. Rodel M. Bataga","Ms. Charmaine L. Oreta","Mr. Jomar V. Paglinawan",
  "Ms. Leah B. Sandoval","Mr. Aldrin P. Caballes","Ms. Rhea Mae T. Villanueva"
];

export const BLOCK_A = [
  ["Computer Programming 1","Engr. Rodel M. Bataga"],
  ["Introduction to Computing","Ms. Charmaine L. Oreta"],
  ["Purposive Communication","Ms. Leah B. Sandoval"],
  ["Understanding the Self","Mr. Aldrin P. Caballes"],
  ["Mathematics in the Modern World","Ms. Rhea Mae T. Villanueva"]
];
export const BLOCK_B = [
  ["Computer Programming 1","Engr. Rodel M. Bataga"],
  ["Discrete Structures","Mr. Jomar V. Paglinawan"],
  ["Introduction to Computing","Ms. Charmaine L. Oreta"],
  ["Purposive Communication","Ms. Leah B. Sandoval"],
  ["Mathematics in the Modern World","Ms. Rhea Mae T. Villanueva"]
];

export const NAMES_A = ["Althea Mae B. Doronila","Jaymar P. Enriquez","Kimberly R. Salazar","Rafael John T. Amoguis",
                 "Princess Joy L. Bacus","Mark Kevin D. Otaza"];
export const NAMES_B = ["Shaina Mae C. Ligaya","Jhon Lloyd M. Pantilgan","Cristine Joy A. Barcenas",
                 "Dave Ryan P. Quiban","Angelica R. Montebon","Niño Kyle S. Abendan"];

export const SCALE_EVAL = [[5,"Excellent"],[4,"Very good"],[3,"Good"],[2,"Fair"],[1,"Poor"]];
export const SCALE_AGREE = [[5,"Strongly agree"],[4,"Agree"],[3,"Neutral"],[2,"Disagree"],[1,"Strongly disagree"]];

export const FACEVAL = {
  id:"faceval",
  title:"Faculty Evaluation",
  subtitle:"BSIT Faculty Evaluation Form, SY 2025–2026",
  scope:"per-instructor",
  scale:SCALE_EVAL,
  rationale:"The purpose of this evaluation is to give feedback to your teacher in his/her subject in order to further improve his/her teaching performance. To make this evaluation reliable: (1) please be honest and objective in answering; (2) do not leave any item blank; (3) leave no teacher behind — evaluate all of them, and if a teacher handles two or more subjects, evaluate them once for each subject, rating 5 as the highest and 1 as the lowest; (4) your truthful response is highly appreciated; and (5) your responses will be kept with utmost confidentiality.",
  sections:[
    {id:"A",title:"Teaching effectiveness",note:"The teacher explained topics clearly, used effective learning strategies, provided timely and constructive feedback, encouraged questions and discussion, and showed enthusiasm and good preparation.",items:[
      {id:"A1",text:"Explains topics clearly and in an organized way."},
      {id:"A2",text:"Uses teaching strategies that help me learn."},
      {id:"A3",text:"Returns feedback on my work on time and with clear direction."},
      {id:"A4",text:"Encourages questions and class discussion."},
      {id:"A5",text:"Comes to class prepared and teaches with enthusiasm."}
    ]},
    {id:"B",title:"Student learning experience",note:"In class, I understood and applied the lessons, gained confidence, completed tasks effectively, and achieved the learning goals with support.",items:[
      {id:"B1",text:"I understand the lessons discussed in class."},
      {id:"B2",text:"I can apply what I learn to activities and real situations."},
      {id:"B3",text:"I feel more confident in this subject as the term goes on."},
      {id:"B4",text:"I finish class tasks and requirements effectively."},
      {id:"B5",text:"I reach the learning goals with the support given to me."}
    ]},
    {id:"C",title:"Classroom environment",note:"The class environment was respectful and inclusive, with effective management, collaboration, and proper handling of disruptions, allowing open expression of ideas.",items:[
      {id:"C1",text:"The class is respectful and inclusive of all students."},
      {id:"C2",text:"Class time is managed well from start to end."},
      {id:"C3",text:"Group work and collaboration are encouraged."},
      {id:"C4",text:"Disruptions are handled fairly and promptly."},
      {id:"C5",text:"I can share my ideas without fear of being judged."}
    ]},
    {id:"D",title:"Use of resources and technology",note:"Instructional materials and technology made lessons easier to understand, more engaging, and better supported my learning.",items:[
      {id:"D1",text:"Instructional materials make the lessons easier to understand."},
      {id:"D2",text:"Technology is used properly and without long delays."},
      {id:"D3",text:"Handouts, slides, and files are available when I need them."},
      {id:"D4",text:"The online tools used support our class activities."},
      {id:"D5",text:"The materials make the class more engaging."}
    ]},
    {id:"E",title:"Learning outcomes and self-reflection",note:"In our class, I achieved the learning outcomes, developed useful skills, improved my critical thinking and problem-solving, became more responsible and self-directed, and learned to reflect on my learning.",items:[
      {id:"E1",text:"I achieved the learning outcomes stated for the subject."},
      {id:"E2",text:"I developed skills I can use in other subjects or at work."},
      {id:"E3",text:"My critical thinking and problem solving improved."},
      {id:"E4",text:"I became more responsible and self-directed in studying."},
      {id:"E5",text:"I can reflect on how I learn and what I need to improve."}
    ]},
    {id:"Q",title:"Comments",kind:"text",note:"Answer in English, Bisaya, or Tagalog. Pwede Bisaya o Tagalog.",items:[
      {id:"Q1",text:"What helped you learn best in this class?",ph:"Unsa ang nakatabang nimo sa pagkat-on?"},
      {id:"Q2",text:"What could be improved to better support your learning?",ph:"Unsa ang pwede pauswagon?"}
    ]}
  ]
};

export const SURVEY = {
  id:"survey",
  title:"BSIT Overall Course Delivery Survey",
  subtitle:"First year BSIT, first semester",
  scope:"once",
  scale:SCALE_AGREE,
  rationale:"This survey covers how the BSIT program was delivered this term. It is answered once and stays separate from faculty evaluation.",
  sections:[
    {id:"A",title:"Course organization & expectations",note:"How clearly the courses were planned and explained.",items:[
      {id:"A1",text:"The BSIT courses were well-organized, with clear learning objectives, course expectations, and requirements."},
      {id:"A2",text:"The topics and learning activities were relevant to the skills and knowledge expected of a BSIT student."}
    ]},
    {id:"B",title:"Course delivery & learning materials",note:"How the content and materials supported your learning.",items:[
      {id:"B1",text:"Course content was presented in a clear and understandable manner."},
      {id:"B2",text:"Learning materials, references, and other resources provided sufficient support for my learning."}
    ]},
    {id:"C",title:"Learning activities & assessment",note:"Whether activities and assessments let you apply what you learned.",items:[
      {id:"C1",text:"Learning activities and assessments provided opportunities to apply and demonstrate what I learned."}
    ]},
    {id:"D",title:"Student engagement & support",note:"Opportunities for interaction, participation, and feedback.",items:[
      {id:"D1",text:"The course delivery provided sufficient opportunities for interaction, participation, and feedback."}
    ]},
    {id:"E",title:"Asynchronous learning",note:"Independent activities completed outside of class time.",items:[
      {id:"E1",text:"Asynchronous activities and materials were clearly explained and provided sufficient guidance for independent learning."},
      {id:"E2",text:"The workload and deadlines for asynchronous activities were reasonable and manageable."}
    ]},
    {id:"F",title:"LMS & online learning environment",note:"How easy the LMS was to use for coursework.",items:[
      {id:"F1",text:"The LMS was organized and easy to navigate, making it easy to access course materials, activities, submissions, and announcements."},
      {id:"F2",text:"Overall, the BSIT course delivery supported my learning and helped me develop knowledge and skills relevant to Information Technology."}
    ]},
    {id:"M",title:"Learning resources & skills",kind:"multiselect",note:"Select all that apply for each question.",items:[
      {id:"M1",text:"Which learning resources helped you learn the most?",options:["Lecture materials","Readings and references","Videos and multimedia","Practical/laboratory activities","Assignments and assessments"]},
      {id:"M2",text:"Which aspects of the course delivery contributed most to your learning?",options:["Clear course organization","Practical and hands-on activities","Projects and application-based tasks","Feedback and assessment","Class participation and collaboration"]},
      {id:"M3",text:"Which skills did you improve through your BSIT courses?",options:["Technical and programming skills","Problem-solving and critical thinking","Communication skills","Teamwork and collaboration","Research and information skills"]}
    ]}
  ]
};

export const FORMS = [FACEVAL, SURVEY];

export const STUDENTS = [
  ...NAMES_A.map((n, i) => ({
    id: "2025-1" + String(101 + i), name: n, group: "BSIT 1-A",
    load: BLOCK_A.map(([course, instructor]) => ({ course, instructor })),
  })),
  ...NAMES_B.map((n, i) => ({
    id: "2025-1" + String(201 + i), name: n, group: "BSIT 1-B",
    load: BLOCK_B.map(([course, instructor]) => ({ course, instructor })),
  })),
];
