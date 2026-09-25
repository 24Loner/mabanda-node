
BEGIN;
INSERT INTO roles(name) VALUES ('administrator'),('teacher'),('class_master')
ON CONFLICT(name) DO NOTHING;

INSERT INTO academic_years(label,is_current) VALUES ('2026/2027',TRUE)
ON CONFLICT(label) DO UPDATE SET is_current=EXCLUDED.is_current;

INSERT INTO terms(academic_year_id,name,sort_order,is_current)
SELECT id,'First Term',1,TRUE FROM academic_years WHERE label='2026/2027'
ON CONFLICT(academic_year_id,name) DO NOTHING;
INSERT INTO terms(academic_year_id,name,sort_order,is_current)
SELECT id,'Second Term',2,FALSE FROM academic_years WHERE label='2026/2027'
ON CONFLICT(academic_year_id,name) DO NOTHING;
INSERT INTO terms(academic_year_id,name,sort_order,is_current)
SELECT id,'Third Term',3,FALSE FROM academic_years WHERE label='2026/2027'
ON CONFLICT(academic_year_id,name) DO NOTHING;

INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'First Sequence',1 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='First Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;
INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'Second Sequence',2 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='First Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;
INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'Third Sequence',1 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='Second Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;
INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'Fourth Sequence',2 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='Second Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;
INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'Fifth Sequence',1 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='Third Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;
INSERT INTO sequences(academic_year_id,term_id,name,sort_order)
SELECT ay.id,t.id,'Final Exam',2 FROM academic_years ay JOIN terms t ON t.academic_year_id=ay.id AND t.name='Third Term' WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,term_id,name) DO NOTHING;

INSERT INTO school_settings(id,school_name,motto,address,email,principal_name,excellent_message,good_message,fail_message,teacher_report_card_access)
VALUES(1,'ATLANTIC BILINGUAL COLLEGE MABANDA','Knowledge, character, excellence','Mabanda, Cameroon','office@mabanda.edu','Dr. Alice Nfor',
'Excellent performance. The student has demonstrated a strong understanding of the subjects covered during this sequence.',
'Good performance. The student should continue working consistently, particularly in subjects where improvement is needed.',
'The student should work more consistently and seek support in subjects where improvement is needed.',FALSE)
ON CONFLICT(id) DO UPDATE SET school_name=EXCLUDED.school_name,motto=EXCLUDED.motto,address=EXCLUDED.address,email=EXCLUDED.email,principal_name=EXCLUDED.principal_name,excellent_message=EXCLUDED.excellent_message,good_message=EXCLUDED.good_message,fail_message=EXCLUDED.fail_message,teacher_report_card_access=EXCLUDED.teacher_report_card_access;

INSERT INTO users(role_id,full_name,email,password_hash,is_active)
SELECT r.id,v.full_name,v.email,'$2y$10$C7unf1cT9Car4bBkWtWxxOwe.L4Gpk5imTSNFNzSfXPaIZJD/qMWS',TRUE FROM (VALUES
('Admin Nfor','admin@mabanda.edu'),('Mr. John Nfor','john@mabanda.edu'),('Mrs. Mary Ewane','mary@mabanda.edu'),('Mr. Peter Fong','peter@mabanda.edu'),('Mrs. Sarah Mbida','sarah@mabanda.edu'),('Mr. David Tanyi','david@mabanda.edu'),('Mrs. Grace Ewane','grace@mabanda.edu')
) v(full_name,email) CROSS JOIN LATERAL (SELECT id FROM roles WHERE name=CASE WHEN v.email='admin@mabanda.edu' THEN 'administrator' ELSE 'teacher' END) r
ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,password_hash=EXCLUDED.password_hash,is_active=TRUE;

-- Preserve the original seed's class-master role for Mrs. Mary Ewane.
UPDATE users SET role_id=(SELECT id FROM roles WHERE name='class_master') WHERE email='mary@mabanda.edu';

INSERT INTO classes(academic_year_id,name,class_master_id)
SELECT ay.id,v.name,cm.id FROM (VALUES('Form 3A','mary@mabanda.edu'),('Form 3B',NULL),('Form 4A',NULL)) v(name,master_email)
JOIN academic_years ay ON ay.label='2026/2027'
LEFT JOIN users cm ON cm.email=v.master_email
ON CONFLICT(academic_year_id,name) DO UPDATE SET class_master_id=EXCLUDED.class_master_id;

INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Mathematics","MAT",20,4,"Sciences") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("English Language","ENG",20,3,"Languages") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Physics","PHY",20,4,"Sciences") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Biology","BIO",20,3,"Sciences") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Computer Science","CSC",20,2,"Technology") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Economics","ECO",20,3,"Humanities") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Geography","GEO",20,2,"Humanities") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("History","HIS",20,2,"Humanities") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("French","FRE",20,2,"Languages") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Literature","LIT",20,2,"Languages") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Agricultural Science","AGR",20,2,"Sciences") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;
INSERT INTO subjects(name,code,max_mark,coefficient,category) VALUES ("Civic Education","CIV",20,1,"Humanities") ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,max_mark=EXCLUDED.max_mark,coefficient=EXCLUDED.coefficient,category=EXCLUDED.category;

INSERT INTO grading_scales(academic_year_id,grade,minimum_percentage,maximum_percentage,evaluation)
SELECT ay.id,v.grade,v.minp,v.maxp,v.eval FROM academic_years ay CROSS JOIN (VALUES
('A',80,100,'Excellent'),('B',70,80,'Very good'),('C',60,70,'Good'),('D',50,60,'Average'),('E',40,50,'Pass'),('F',0,40,'Fail')
) v(grade,minp,maxp,eval) WHERE ay.label='2026/2027'
ON CONFLICT(academic_year_id,grade) DO UPDATE SET minimum_percentage=EXCLUDED.minimum_percentage,maximum_percentage=EXCLUDED.maximum_percentage,evaluation=EXCLUDED.evaluation;

INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3001","REG-3001","John Doe","male","2011-02-14","Robert Doe","+237600000301") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3002","REG-3002","Mary Smith","female","2011-05-21","Helen Smith","+237600000302") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3003","REG-3003","Peter Brown","male","2011-08-02","Paul Brown","+237600000303") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3004","REG-3004","Amelia Nfor","female","2011-01-10","Alice Nfor","+237600000304") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3005","REG-3005","Daniel Tanyi","male","2011-03-18","David Tanyi","+237600000305") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3006","REG-3006","Grace Mbida","female","2011-06-05","Sarah Mbida","+237600000306") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3007","REG-3007","Michael Fong","male","2011-09-12","Peter Fong","+237600000307") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3008","REG-3008","Sarah Ewane","female","2011-11-27","Mary Ewane","+237600000308") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3009","REG-3009","David Ekane","male","2011-04-13","Paul Ekane","+237600000309") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3010","REG-3010","Lydia Mbah","female","2011-07-29","Rose Mbah","+237600000310") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3011","REG-3011","Chris Atem","male","2011-10-09","John Atem","+237600000311") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3012","REG-3012","Helen Tita","female","2011-12-15","Mark Tita","+237600000312") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3013","REG-3013","Samuel Che","male","2011-02-19","Emmanuel Che","+237600000313") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3014","REG-3014","Julia Fon","female","2011-05-11","Grace Fon","+237600000314") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3015","REG-3015","Eric Nji","male","2011-08-24","Simon Nji","+237600000315") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3016","REG-3016","Clara Ngo","female","2011-01-31","Anne Ngo","+237600000316") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3017","REG-3017","Brian Taku","male","2011-03-07","Chris Taku","+237600000317") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3018","REG-3018","Martha Eko","female","2011-06-22","Rose Eko","+237600000318") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3019","REG-3019","Patrick Luma","male","2011-09-16","Paul Luma","+237600000319") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3020","REG-3020","Esther Mbi","female","2011-11-03","Mary Mbi","+237600000320") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3021","REG-3021","Kevin Nje","male","2011-04-26","John Nje","+237600000321") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3022","REG-3022","Ruth Feka","female","2011-07-08","Alice Feka","+237600000322") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3023","REG-3023","George Nso","male","2011-10-20","David Nso","+237600000323") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3024","REG-3024","Irene Meka","female","2011-12-02","Helen Meka","+237600000324") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3025","REG-3025","Andrew Tabe","male","2011-02-28","Paul Tabe","+237600000325") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3026","REG-3026","Lucy Nya","female","2011-05-17","Sarah Nya","+237600000326") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3027","REG-3027","Mark Etem","male","2011-08-30","Peter Etem","+237600000327") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3028","REG-3028","Anna Ndem","female","2011-01-22","Mary Ndem","+237600000328") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3029","REG-3029","Victor Muna","male","2011-03-29","David Muna","+237600000329") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3030","REG-3030","Rose Fom","female","2011-06-14","Grace Fom","+237600000330") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3031","REG-3031","Thomas Nji","male","2011-09-05","Robert Nji","+237600000331") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3032","REG-3032","Beatrice Nso","female","2011-11-18","Alice Nso","+237600000332") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3033","REG-3033","James Manka","male","2011-04-04","Peter Manka","+237600000333") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3034","REG-3034","Diana Mbi","female","2011-07-21","Helen Mbi","+237600000334") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3035","REG-3035","Francis Eko","male","2011-10-11","Paul Eko","+237600000335") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;
INSERT INTO students(student_id,registration_number,full_name,gender,date_of_birth,guardian_name,guardian_phone) VALUES ("ST-3036","REG-3036","Naomi Tita","female","2011-12-27","Sarah Tita","+237600000336") ON CONFLICT(student_id) DO UPDATE SET registration_number=EXCLUDED.registration_number,full_name=EXCLUDED.full_name,gender=EXCLUDED.gender,date_of_birth=EXCLUDED.date_of_birth,guardian_name=EXCLUDED.guardian_name,guardian_phone=EXCLUDED.guardian_phone;

-- The original demo promotes Peter Fong and Sarah Mbida to class masters for the other two classes.
UPDATE classes SET class_master_id=(SELECT id FROM users WHERE email='peter@mabanda.edu') WHERE name='Form 3B' AND academic_year_id=(SELECT id FROM academic_years WHERE label='2026/2027');
UPDATE classes SET class_master_id=(SELECT id FROM users WHERE email='sarah@mabanda.edu') WHERE name='Form 4A' AND academic_year_id=(SELECT id FROM academic_years WHERE label='2026/2027');

-- Match the original demo's class split without relying on numeric student IDs.
INSERT INTO class_students(class_id,student_id,academic_year_id)
SELECT c.id,s.id,ay.id
FROM students s
JOIN academic_years ay ON ay.label='2026/2027'
JOIN classes c ON c.academic_year_id=ay.id
WHERE s.student_id BETWEEN 'ST-3001' AND 'ST-3036'
  AND c.name = CASE WHEN CAST(SUBSTRING(s.student_id,5) AS INTEGER) <= 3012 THEN 'Form 3A'
                    WHEN CAST(SUBSTRING(s.student_id,5) AS INTEGER) <= 3024 THEN 'Form 3B'
                    ELSE 'Form 4A' END
ON CONFLICT DO NOTHING;

-- Core assignment set from the original demo, plus the original Form 3A/Form 3B starter assignments.
INSERT INTO teacher_subject_classes(teacher_id,subject_id,class_id)
SELECT u.id,s.id,c.id FROM users u JOIN subjects s ON s.code='MAT' JOIN classes c ON c.name IN ('Form 3A','Form 3B')
WHERE u.email='john@mabanda.edu' ON CONFLICT(teacher_id,subject_id,class_id) DO UPDATE SET is_active=TRUE;
INSERT INTO teacher_subject_classes(teacher_id,subject_id,class_id)
SELECT u.id,s.id,c.id FROM users u JOIN subjects s ON s.code='ENG' JOIN classes c ON c.name IN ('Form 3A','Form 3B')
WHERE u.email='mary@mabanda.edu' ON CONFLICT(teacher_id,subject_id,class_id) DO UPDATE SET is_active=TRUE;

-- Demo assignment rows, using unique emails/codes/class names rather than fixed IDs.
INSERT INTO teacher_subject_classes(teacher_id,subject_id,class_id)
SELECT u.id,s.id,c.id FROM (VALUES
('peter@mabanda.edu','PHY'),('sarah@mabanda.edu','BIO'),('david@mabanda.edu','CSC'),('grace@mabanda.edu','ECO'),('peter@mabanda.edu','GEO')
) v(email,code)
JOIN users u ON u.email=v.email JOIN subjects s ON s.code=v.code CROSS JOIN classes c
ON CONFLICT(teacher_id,subject_id,class_id) DO UPDATE SET is_active=TRUE;

-- The original demo populates all five core subjects for all demo students and all six sequences.
INSERT INTO results(student_id,subject_id,class_id,sequence_id,academic_year_id,term_id,mark,status,entered_by,updated_by)
SELECT cs.student_id,sub.id,cs.class_id,seq.id,ay.id,seq.term_id,
       MOD(cs.student_id * 3 + sub.id * 2 + seq.id,16) + 5,
       'submitted',
       CASE sub.code WHEN 'MAT' THEN (SELECT id FROM users WHERE email='john@mabanda.edu')
                    WHEN 'ENG' THEN (SELECT id FROM users WHERE email='mary@mabanda.edu')
                    WHEN 'PHY' THEN (SELECT id FROM users WHERE email='peter@mabanda.edu')
                    WHEN 'BIO' THEN (SELECT id FROM users WHERE email='sarah@mabanda.edu')
                    ELSE (SELECT id FROM users WHERE email='david@mabanda.edu') END,
       CASE sub.code WHEN 'MAT' THEN (SELECT id FROM users WHERE email='john@mabanda.edu')
                    WHEN 'ENG' THEN (SELECT id FROM users WHERE email='mary@mabanda.edu')
                    WHEN 'PHY' THEN (SELECT id FROM users WHERE email='peter@mabanda.edu')
                    WHEN 'BIO' THEN (SELECT id FROM users WHERE email='sarah@mabanda.edu')
                    ELSE (SELECT id FROM users WHERE email='david@mabanda.edu') END
FROM class_students cs
JOIN academic_years ay ON ay.id=cs.academic_year_id AND ay.label='2026/2027'
CROSS JOIN subjects sub
CROSS JOIN sequences seq
WHERE sub.code IN ('MAT','ENG','PHY','BIO','CSC')
ON CONFLICT(student_id,subject_id,class_id,academic_year_id,term_id,sequence_id) DO NOTHING;

COMMIT;
