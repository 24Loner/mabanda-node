
'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const puppeteer = require('puppeteer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && /sslmode=require/i.test(process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
});

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const REPORT_DIR = path.join(ROOT, 'storage', 'reports');
fs.mkdirSync(REPORT_DIR, { recursive: true });

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new pgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12,
  },
}));

function httpError(message, status = 500) {
  const e = new Error(message);
  e.status = status;
  return e;
}
function requireUser(req) {
  if (!req.session.user) throw httpError('Authentication required.', 401);
  return req.session.user;
}
function requireRole(req, roles) {
  const user = requireUser(req);
  if (!roles.includes(user.role)) throw httpError('Forbidden: insufficient permissions.', 403);
  return user;
}
function requireCsrf(req) {
  const expected = req.session.csrf || '';
  const provided = req.get('X-CSRF-Token') || '';
  if (!expected || !provided || expected.length !== provided.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
    throw httpError('Invalid CSRF token.', 419);
  }
}
function json(res, body, status = 200) { res.status(status).json(body); }
function parseIntParam(v, fallback = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function parseNullableInt(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function lowerEmail(v) { return String(v || '').trim().toLowerCase(); }
function round2(v) { return Math.round((Number(v) + Number.EPSILON) * 100) / 100; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
}
async function q(text, params = []) { return pool.query(text, params); }
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}

async function currentYear() {
  const r = await q('SELECT id,label FROM academic_years WHERE is_current=TRUE ORDER BY id DESC LIMIT 1');
  return r.rows[0] || { id: 0, label: null };
}
async function firstSequence(yearId) {
  const r = await q('SELECT id,name FROM sequences WHERE academic_year_id=$1 ORDER BY sort_order LIMIT 1', [yearId]);
  return r.rows[0] || { id: 0, name: null };
}
async function classIdsFor(user) {
  if (user.role === 'administrator') {
    const r = await q('SELECT id FROM classes WHERE is_active=TRUE');
    return r.rows.map(x => Number(x.id));
  }
  if (user.role === 'class_master') {
    const r = await q('SELECT id FROM classes WHERE class_master_id=$1 AND is_active=TRUE', [user.id]);
    return r.rows.map(x => Number(x.id));
  }
  const r = await q('SELECT DISTINCT class_id FROM teacher_subject_classes WHERE teacher_id=$1 AND is_active=TRUE', [user.id]);
  return r.rows.map(x => Number(x.class_id));
}
async function assertClassAccess(user, classId) {
  const ids = await classIdsFor(user);
  if (!ids.includes(Number(classId))) throw httpError('Forbidden: you do not have access to this class.', 403);
}
async function grade(yearId, percentage) {
  const r = await q('SELECT grade,evaluation FROM grading_scales WHERE academic_year_id=$1 AND $2 >= minimum_percentage ORDER BY minimum_percentage DESC LIMIT 1', [yearId, percentage]);
  return r.rows[0] || { grade: null, evaluation: 'Pending' };
}
async function studentCalculation(studentId, classId, yearId, sequenceId) {
  const r = await q(`SELECT r.mark,sub.name,sub.max_mark,sub.coefficient
                     FROM results r INNER JOIN subjects sub ON sub.id=r.subject_id
                     WHERE r.student_id=$1 AND r.class_id=$2 AND r.academic_year_id=$3 AND r.sequence_id=$4
                     ORDER BY sub.name`, [studentId,classId,yearId,sequenceId]);
  let totalWeight=0,totalPossible=0;
  for (const row of r.rows) {
    row.percentage=round2(Number(row.mark)/Number(row.max_mark)*100);
    row.weighted_mark=round2(Number(row.mark)*Number(row.coefficient));
    const g=await grade(yearId,row.percentage);
    row.grade=g.grade; row.evaluation=g.evaluation;
    totalWeight+=Number(row.weighted_mark); totalPossible+=Number(row.max_mark)*Number(row.coefficient);
  }
  const avg=totalPossible>0?round2(totalWeight/totalPossible*100):0;
  const g=await grade(yearId,avg);
  return {
    rows:r.rows,total_weight:round2(totalWeight),total_possible:round2(totalPossible),
    average_percentage:avg,grade:g.grade,evaluation:g.evaluation,
    passed:r.rows.filter(x=>Number(x.percentage)>=40).length,
    failed:r.rows.filter(x=>Number(x.percentage)<40).length
  };
}
async function classSummary(classId, yearId, sequenceId) {
  const s=await q('SELECT DISTINCT student_id FROM class_students WHERE class_id=$1 AND academic_year_id=$2',[classId,yearId]);
  const ranking=[];
  for(const row of s.rows){
    const summary=await studentCalculation(Number(row.student_id),classId,yearId,sequenceId);
    ranking.push({student_id:Number(row.student_id),average_percentage:summary.average_percentage});
  }
  ranking.sort((a,b)=>b.average_percentage-a.average_percentage);
  let rank=0,last=null;
  ranking.forEach((item,index)=>{if(last===null||item.average_percentage<last) rank=index+1; item.position=rank; last=item.average_percentage;});
  const avg=ranking.length?round2(ranking.reduce((a,x)=>a+x.average_percentage,0)/ranking.length):0;
  return {ranking,class_average:avg,student_count:ranking.length,
    total_passed:ranking.filter(x=>x.average_percentage>=40).length,
    total_failed:ranking.filter(x=>x.average_percentage<40).length};
}
async function overview(yearId, average) {
  const r=await q('SELECT excellent_message,good_message,fail_message FROM school_settings WHERE id=1');
  const s=r.rows[0]||{};
  if(average>=80) return s.excellent_message || 'Excellent performance. The student has demonstrated a strong understanding of the subjects covered during this sequence.';
  if(average>=50) return s.good_message || 'Good performance. The student should continue working consistently, particularly in subjects where improvement is needed.';
  return s.fail_message || 'The student should work more consistently and seek support in subjects where improvement is needed.';
}
async function history(studentId) {
  const e=await q(`SELECT cs.class_id,c.name AS class_name,cs.academic_year_id,ay.label AS academic_year
                   FROM class_students cs INNER JOIN classes c ON c.id=cs.class_id INNER JOIN academic_years ay ON ay.id=cs.academic_year_id
                   WHERE cs.student_id=$1 ORDER BY ay.label,cs.academic_year_id,c.name`,[studentId]);
  const out=[];
  for(const en of e.rows){
    const seqs=await q('SELECT id,name,sort_order FROM sequences WHERE academic_year_id=$1 ORDER BY sort_order',[en.academic_year_id]);
    for(const seq of seqs.rows){
      const s=await studentCalculation(studentId,Number(en.class_id),Number(en.academic_year_id),Number(seq.id));
      out.push({academic_year_id:Number(en.academic_year_id),academic_year:en.academic_year,class_id:Number(en.class_id),class_name:en.class_name,
        sequence_id:Number(seq.id),sequence:seq.name,sequence_order:Number(seq.sort_order),average_percentage:s.average_percentage,
        grade:s.grade,evaluation:s.evaluation,subjects:s.rows.length,passed:s.passed,failed:s.failed});
    }
  }
  let previous=null;
  for(const p of out){p.delta=previous===null?null:round2(p.average_percentage-previous);p.trend=p.delta===null?'baseline':p.delta>0?'improving':p.delta<0?'declining':'stable';previous=p.average_percentage;}
  return out;
}

async function academicStudents(user,classId,yearId) {
  await assertClassAccess(user,classId);
  const r=await q(`SELECT s.*,c.name AS class_name,ay.label AS academic_year
                   FROM students s INNER JOIN class_students cs ON cs.student_id=s.id
                   INNER JOIN classes c ON c.id=cs.class_id INNER JOIN academic_years ay ON ay.id=cs.academic_year_id
                   WHERE cs.class_id=$1 AND cs.academic_year_id=$2 AND s.is_active=TRUE ORDER BY s.full_name`,[classId,yearId]);
  return r.rows;
}
async function academicResults(user,classId,yearId,sequenceId,termId=0) {
  await assertClassAccess(user,classId);
  let sql=`SELECT r.*,s.full_name,s.student_id AS student_number,sub.name AS subject_name,sub.max_mark,sub.coefficient,
           ROUND((r.mark/sub.max_mark*100)::numeric,2) AS percentage,
           ROUND((r.mark*sub.coefficient)::numeric,2) AS weighted_mark,
           COALESCE(g.grade,'Pending') AS grade,COALESCE(g.evaluation,'Pending') AS evaluation
           FROM results r INNER JOIN students s ON s.id=r.student_id INNER JOIN subjects sub ON sub.id=r.subject_id
           LEFT JOIN grading_scales g ON g.academic_year_id=r.academic_year_id
             AND r.mark/sub.max_mark*100 >= g.minimum_percentage
             AND (r.mark/sub.max_mark*100 < g.maximum_percentage OR (g.maximum_percentage=100 AND r.mark/sub.max_mark*100 <= 100))
           WHERE r.class_id=$1 AND r.academic_year_id=$2 AND r.sequence_id=$3`;
  const params=[classId,yearId,sequenceId];
  if(termId>0){params.push(termId);sql+=` AND r.term_id=$${params.length}`;}
  if(user.role==='teacher'){params.push(user.id);sql+=` AND EXISTS (SELECT 1 FROM teacher_subject_classes a WHERE a.teacher_id=$${params.length} AND a.subject_id=r.subject_id AND a.class_id=r.class_id AND a.is_active=TRUE)`;}
  sql+=' ORDER BY s.full_name,sub.name';
  return (await q(sql,params)).rows;
}
async function academicPerformance(user,classId,yearId,sequenceId,termId=0) {
  const results=await academicResults(user,classId,yearId,sequenceId,termId);
  const students=new Map();
  for(const r of results){
    const id=Number(r.student_id);
    if(!students.has(id)) students.set(id,{student_id:id,full_name:r.full_name,total_weight:0,total_possible:0,subjects:0});
    const s=students.get(id); s.total_weight+=Number(r.mark)*Number(r.coefficient); s.total_possible+=Number(r.max_mark)*Number(r.coefficient); s.subjects++;
  }
  const arr=[...students.values()].map(s=>({...s,average_percentage:s.total_possible>0?round2(s.total_weight/s.total_possible*100):0}));
  arr.sort((a,b)=>b.average_percentage-a.average_percentage); arr.forEach((s,i)=>s.position=i+1);
  return {students:arr,student_count:arr.length,class_average:arr.length?round2(arr.reduce((a,s)=>a+s.average_percentage,0)/arr.length):0};
}

async function saveResult(input,user){
  const required=['student_id','subject_id','class_id','academic_year_id','term_id','sequence_id','mark'];
  for(const f of required) if(!(f in input)||input[f]==='') throw httpError(`Missing field: ${f}.`,422);
  return tx(async client=>{
    const subject=(await client.query('SELECT id,max_mark FROM subjects WHERE id=$1 LIMIT 1',[Number(input.subject_id)])).rows[0];
    if(!subject) throw httpError('Subject not found.',404);
    const mark=Number(input.mark);
    if(!Number.isFinite(mark)||mark<0||mark>Number(subject.max_mark)) throw httpError(`Mark must be between 0 and ${subject.max_mark}.`,422);
    if(user.role==='teacher'){
      const a=await client.query('SELECT 1 FROM teacher_subject_classes WHERE teacher_id=$1 AND subject_id=$2 AND class_id=$3 AND is_active=TRUE LIMIT 1',[user.id,Number(input.subject_id),Number(input.class_id)]);
      if(!a.rowCount) throw httpError('Unauthorized: you are not assigned to teach this subject for this class.',403);
    }
    const st=await client.query('SELECT 1 FROM class_students WHERE student_id=$1 AND class_id=$2 AND academic_year_id=$3 LIMIT 1',[Number(input.student_id),Number(input.class_id),Number(input.academic_year_id)]);
    if(!st.rowCount) throw httpError('Student is not registered in this class and academic year.',422);
    const fin=await client.query('SELECT is_reopened FROM result_finalizations WHERE academic_year_id=$1 AND term_id=$2 AND sequence_id=$3 LIMIT 1',[Number(input.academic_year_id),Number(input.term_id),Number(input.sequence_id)]);
    const finalized=fin.rowCount?fin.rows[0].is_reopened:false;
    const hasFinalization=fin.rowCount>0;
    if(hasFinalization&&!finalized&&user.role!=='administrator') throw httpError('This sequence has been finalized and cannot be edited.',423);
    const oldR=await client.query(`SELECT id,mark,status FROM results WHERE student_id=$1 AND subject_id=$2 AND class_id=$3 AND term_id=$4 AND sequence_id=$5 AND academic_year_id=$6 FOR UPDATE`,
      [Number(input.student_id),Number(input.subject_id),Number(input.class_id),Number(input.term_id),Number(input.sequence_id),Number(input.academic_year_id)]);
    const old=oldR.rows[0];
    if(old&&['submitted','approved','locked'].includes(old.status)&&user.role!=='administrator'&&!(hasFinalization&&finalized)) throw httpError('This result has been submitted and cannot be modified by a teacher.',423);
    let resultId,status=old?.status||'draft';
    if(old){await client.query('UPDATE results SET mark=$1,updated_by=$2,updated_at=NOW() WHERE id=$3',[mark,user.id,old.id]);resultId=Number(old.id);}
    else {const ins=await client.query(`INSERT INTO results(student_id,subject_id,class_id,academic_year_id,term_id,sequence_id,mark,status,entered_by,updated_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING id`,[Number(input.student_id),Number(input.subject_id),Number(input.class_id),Number(input.academic_year_id),Number(input.term_id),Number(input.sequence_id),mark,status,user.id]);resultId=Number(ins.rows[0].id);}
    await client.query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id,student_id,subject_id,previous_value,new_value)
      VALUES($1,$2,'result',$3,$4,$5,$6,$7)`,[user.id,old?'updated':'created',resultId,Number(input.student_id),Number(input.subject_id),old?String(old.mark):null,String(mark)]);
    return {id:resultId,mark,status};
  });
}
async function submitResults(input,user){
  if(!['administrator','teacher'].includes(user.role)) throw httpError('Forbidden: only teachers or administrators may submit results.',403);
  for(const f of ['class_id','subject_id','academic_year_id','term_id','sequence_id']) if(!(f in input)||input[f]==='') throw httpError(`Missing field: ${f}.`,422);
  const fin=await q('SELECT is_reopened FROM result_finalizations WHERE academic_year_id=$1 AND term_id=$2 AND sequence_id=$3 LIMIT 1',[Number(input.academic_year_id),Number(input.term_id),Number(input.sequence_id)]);
  if(fin.rowCount&&!fin.rows[0].is_reopened&&user.role!=='administrator') throw httpError('This sequence has been finalized and cannot be submitted.',423);
  let sql=`SELECT r.id FROM results r WHERE r.class_id=$1 AND r.subject_id=$2 AND r.sequence_id=$3 AND r.academic_year_id=$4 AND r.term_id=$5`;
  const params=[Number(input.class_id),Number(input.subject_id),Number(input.sequence_id),Number(input.academic_year_id),Number(input.term_id)];
  if(user.role==='teacher'){params.push(user.id);sql+=` AND EXISTS (SELECT 1 FROM teacher_subject_classes a WHERE a.teacher_id=$${params.length} AND a.subject_id=r.subject_id AND a.class_id=r.class_id AND a.is_active=TRUE)`;}
  const ids=(await q(sql,params)).rows.map(x=>Number(x.id));
  if(!ids.length) throw httpError('No results found to submit.',422);
  const expected=Number((await q('SELECT COUNT(*) FROM class_students WHERE class_id=$1 AND academic_year_id=$2',[Number(input.class_id),Number(input.academic_year_id)])).rows[0].count);
  if(ids.length<expected) throw httpError('Some students do not have results entered for this subject.',422);
  const placeholders=ids.map((_,i)=>`$${i+2}`).join(',');
  await q(`UPDATE results SET status='submitted',updated_by=$1 WHERE id IN (${placeholders})`,[user.id,...ids]);
  return {submitted:ids.length};
}
async function transitionResult(resultId,target,user){
  if(user.role!=='administrator') throw httpError('Forbidden: only administrators may approve, lock, or unlock results.',403);
  const allowed={approved:['submitted'],locked:['approved'],approved_from_locked:['locked']};
  if(!allowed[target]) throw httpError('Invalid result transition.',422);
  const next=target==='approved_from_locked'?'approved':target;
  return tx(async client=>{
    const r=(await client.query('SELECT id,status,student_id,subject_id FROM results WHERE id=$1 FOR UPDATE',[resultId])).rows[0];
    if(!r) throw httpError('Result not found.',404);
    if(!allowed[target].includes(r.status)) throw httpError('Invalid result status transition.',409);
    await client.query('UPDATE results SET status=$1,updated_by=$2 WHERE id=$3',[next,user.id,resultId]);
    await client.query(`INSERT INTO audit_logs(user_id,action,entity_type,entity_id,student_id,subject_id,previous_value,new_value)
      VALUES($1,$2,'result',$3,$4,$5,$6,$7)`,[user.id,next,resultId,r.student_id,r.subject_id,r.status,next]);
    return {id:resultId,previous_status:r.status,status:next};
  });
}

async function analyticsSubmitted(yearId,termId,sequenceId,teacherId,classId,subjectId,search=''){
  let where=`r.academic_year_id=$1 AND r.term_id=$2 AND r.sequence_id=$3 AND r.status IN ('submitted','approved','locked')`;
  const params=[yearId,termId,sequenceId];
  const add=(cond,val)=>{params.push(val);where+=` AND ${cond.replace('?',`$${params.length}`)}`;};
  if(teacherId) add('r.entered_by=?',teacherId); if(classId) add('r.class_id=?',classId); if(subjectId) add('r.subject_id=?',subjectId);
  if(search){params.push(`%${search}%`,`%${search}%`);where+=` AND (st.full_name ILIKE $${params.length-1} OR st.student_id ILIKE $${params.length})`;}
  return (await q(`SELECT r.id,r.mark,r.status,r.updated_at,st.full_name AS student_name,st.student_id AS student_number,c.name AS class_name,sub.name AS subject_name,u.full_name AS teacher_name,seq.name AS sequence_name,term.name AS term_name,ay.label AS academic_year,sub.max_mark,ROUND((r.mark/sub.max_mark*100)::numeric,2) AS percentage
    FROM results r INNER JOIN students st ON st.id=r.student_id INNER JOIN classes c ON c.id=r.class_id INNER JOIN subjects sub ON sub.id=r.subject_id INNER JOIN users u ON u.id=r.entered_by INNER JOIN sequences seq ON seq.id=r.sequence_id INNER JOIN terms term ON term.id=r.term_id INNER JOIN academic_years ay ON ay.id=r.academic_year_id WHERE ${where} ORDER BY c.name,st.full_name,sub.name`,params)).rows;
}
async function analyticsStudentReports(yearId,termId,sequenceId,classId,search=''){
  let where=`r.academic_year_id=$1 AND r.term_id=$2 AND r.sequence_id=$3`;const params=[yearId,termId,sequenceId];
  if(classId){params.push(classId);where+=` AND r.class_id=$${params.length}`;}
  if(search){params.push(`%${search}%`,`%${search}%`,`%${search}%`);where+=` AND (s.full_name ILIKE $${params.length-2} OR s.student_id ILIKE $${params.length-1} OR s.registration_number ILIKE $${params.length})`;}
  const rows=(await q(`SELECT r.student_id,r.class_id,r.mark,r.status,s.full_name,s.student_id AS student_number,c.name AS class_name,sub.max_mark,sub.coefficient
    FROM results r INNER JOIN students s ON s.id=r.student_id INNER JOIN classes c ON c.id=r.class_id INNER JOIN subjects sub ON sub.id=r.subject_id WHERE ${where} ORDER BY s.full_name,c.name`,params)).rows;
  const grouped=new Map();
  for(const row of rows){
    const key=`${row.student_id}:${row.class_id}`;
    if(!grouped.has(key)) grouped.set(key,{student_id:Number(row.student_id),student_number:row.student_number,student_name:row.full_name,class_id:Number(row.class_id),class_name:row.class_name,total_weight:0,total_possible:0,subjects:0,submitted:true});
    const x=grouped.get(key);x.total_weight+=Number(row.mark)*Number(row.coefficient);x.total_possible+=Number(row.max_mark)*Number(row.coefficient);x.subjects++;x.submitted=x.submitted&&['submitted','approved','locked'].includes(row.status);
  }
  const reports=[...grouped.values()].map(x=>{x.average=x.total_possible>0?round2(x.total_weight/x.total_possible*100):0;delete x.total_weight;delete x.total_possible;return x;});
  reports.sort((a,b)=>b.average-a.average);reports.forEach((x,i)=>x.position=i+1);return reports;
}
async function analyticsDashboard(yearId,sequenceId,classId,subjectId,termId){
  let where=`r.academic_year_id=$1 AND r.sequence_id=$2`;const params=[yearId,sequenceId];
  if(termId){params.push(termId);where+=` AND r.term_id=$${params.length}`;}if(classId){params.push(classId);where+=` AND r.class_id=$${params.length}`;}if(subjectId){params.push(subjectId);where+=` AND r.subject_id=$${params.length}`;}
  const rows=(await q(`SELECT r.mark,sub.max_mark,sub.name AS subject_name,c.name AS class_name,r.student_id FROM results r INNER JOIN subjects sub ON sub.id=r.subject_id INNER JOIN classes c ON c.id=r.class_id WHERE ${where}`,params)).rows;
  const classMap={},subjectMap={};let passed=0;
  for(const row of rows){const p=Number(row.mark)/Number(row.max_mark)*100;if(p>=40)passed++;(classMap[row.class_name]??=[]).push(p);(subjectMap[row.subject_name]??=[]).push(p);}
  const average=rows.length?round2(rows.reduce((a,r)=>a+Number(r.mark)/Number(r.max_mark)*100,0)/rows.length):0;
  const reduce=v=>round2(v.reduce((a,x)=>a+x,0)/v.length);
  const classes=Object.entries(classMap).map(([name,v])=>({name,average:reduce(v)})).sort((a,b)=>b.average-a.average);
  const subjects=Object.entries(subjectMap).map(([name,v])=>({name,average:reduce(v)})).sort((a,b)=>b.average-a.average);
  return {total_students:new Set(rows.map(r=>r.student_id)).size,overall_average:average,passing_results:passed,failing_results:rows.length-passed,pass_percentage:rows.length?round2(passed/rows.length*100):0,
    classes,subjects,best_class:classes[0]||null,lowest_class:classes.at(-1)||null,best_subject:subjects[0]||null,weakest_subject:subjects.at(-1)||null};
}
async function analyticsSubject(subjectId,yearId,sequenceId){
  const rows=(await q('SELECT r.mark,sub.max_mark,c.name AS class_name FROM results r INNER JOIN subjects sub ON sub.id=r.subject_id INNER JOIN classes c ON c.id=r.class_id WHERE r.subject_id=$1 AND r.academic_year_id=$2 AND r.sequence_id=$3',[subjectId,yearId,sequenceId])).rows;
  const percentages=rows.map(r=>Number(r.mark)/Number(r.max_mark)*100);const groups={};
  for(const row of rows){const p=Number(row.mark)/Number(row.max_mark)*100;(groups[row.class_name]??=[]).push(p);}
  const byClass=Object.entries(groups).map(([class_name,v])=>({class_name,student_count:v.length,average:round2(v.reduce((a,x)=>a+x,0)/v.length),pass_rate:round2(v.filter(x=>x>=40).length/v.length*100)}));
  return {student_count:rows.length,average:rows.length?round2(percentages.reduce((a,x)=>a+x,0)/rows.length):0,highest:rows.length?round2(Math.max(...percentages)):0,lowest:rows.length?round2(Math.min(...percentages)):0,pass_rate:rows.length?round2(percentages.filter(x=>x>=40).length/rows.length*100):0,by_class:byClass};
}

async function dashboardFor(user){
  const year=await currentYear();const sequence=await firstSequence(Number(year.id));
  if(user.role==='administrator'){
    const counts={students:Number((await q('SELECT COUNT(*) FROM students WHERE is_active=TRUE')).rows[0].count),
      teachers:Number((await q("SELECT COUNT(*) FROM users u INNER JOIN roles r ON r.id=u.role_id WHERE r.name='teacher' AND u.is_active=TRUE")).rows[0].count),
      classes:Number((await q('SELECT COUNT(*) FROM classes WHERE is_active=TRUE')).rows[0].count),
      subjects:Number((await q('SELECT COUNT(*) FROM subjects WHERE is_active=TRUE')).rows[0].count)};
    return {role:user.role,academic_year:year,sequence,counts,analytics:await analyticsDashboard(Number(year.id),Number(sequence.id),null,null,null)};
  }
  const classes=await classIdsFor(user);let assignedSubjects=0;
  if(user.role==='teacher') assignedSubjects=Number((await q('SELECT COUNT(DISTINCT subject_id) FROM teacher_subject_classes WHERE teacher_id=$1 AND is_active=TRUE',[user.id])).rows[0].count);
  let studentCount=0;if(classes.length){studentCount=Number((await q(`SELECT COUNT(DISTINCT student_id) FROM class_students WHERE academic_year_id=$1 AND class_id=ANY($2::int[])`,[Number(year.id),classes])).rows[0].count);}
  if(user.role==='teacher'){
    const pending=Number((await q(`SELECT COUNT(*) FROM teacher_subject_classes a INNER JOIN class_students cs ON cs.class_id=a.class_id AND cs.academic_year_id=$1 LEFT JOIN results r ON r.student_id=cs.student_id AND r.subject_id=a.subject_id AND r.class_id=a.class_id AND r.academic_year_id=$1 AND r.sequence_id=$2 WHERE a.teacher_id=$3 AND a.is_active=TRUE AND r.id IS NULL`,[Number(year.id),Number(sequence.id),user.id])).rows[0].count);
    const completed=Number((await q(`SELECT COUNT(*) FROM results r INNER JOIN teacher_subject_classes a ON a.subject_id=r.subject_id AND a.class_id=r.class_id WHERE a.teacher_id=$1 AND r.academic_year_id=$2 AND r.sequence_id=$3 AND r.status IN ('submitted','approved','locked')`,[user.id,Number(year.id),Number(sequence.id)])).rows[0].count);
    const assigned=(await q(`SELECT s.name AS subject_name,c.name AS class_name FROM teacher_subject_classes a INNER JOIN subjects s ON s.id=a.subject_id INNER JOIN classes c ON c.id=a.class_id WHERE a.teacher_id=$1 AND a.is_active=TRUE ORDER BY c.name,s.name`,[user.id])).rows;
    return {role:user.role,academic_year:year,sequence,assigned_subjects:assignedSubjects,assigned_classes:classes.length,students:studentCount,pending_results:pending,completed_results:completed,assignments:assigned};
  }
  const details=[];
  for(const classId of classes){const c=(await q('SELECT id,name FROM classes WHERE id=$1',[classId])).rows[0];details.push({id:Number(c.id),name:c.name,students:(await academicStudents(user,classId,Number(year.id))).length,performance:await classSummary(classId,Number(year.id),Number(sequence.id))});}
  return {role:user.role,academic_year:year,sequence,assigned_classes:classes.length,assigned_subjects:0,students:studentCount,classes:details};
}

async function canAccessReports(user){
  if(['administrator','class_master'].includes(user.role)) return true;
  if(user.role!=='teacher') return false;
  const r=await q('SELECT teacher_report_card_access FROM school_settings WHERE id=1');
  return Boolean(r.rows[0]?.teacher_report_card_access);
}

async function annualReportData(studentId, classId, yearId) {

  // ------------------------------------------------------------
  // STUDENT INFORMATION
  // ------------------------------------------------------------

  const student = (
    await q(
      `SELECT
         s.*,
         c.name AS class_name,
         ay.label AS academic_year
       FROM students s
       INNER JOIN class_students cs
         ON cs.student_id = s.id
       INNER JOIN classes c
         ON c.id = cs.class_id
       INNER JOIN academic_years ay
         ON ay.id = cs.academic_year_id
       WHERE s.id = $1
         AND c.id = $2
         AND ay.id = $3
       LIMIT 1`,
      [studentId, classId, yearId]
    )
  ).rows[0];

  if (!student) {
    throw httpError(
      'Student is not registered in this class and academic year.',
      404
    );
  }


  // ------------------------------------------------------------
  // ASSESSMENT SEQUENCES
  // ------------------------------------------------------------

  const periods = (
    await q(
      `SELECT
         seq.id,
         seq.name,
         seq.sort_order,
         term.name AS term_name,
         term.sort_order AS term_order
       FROM sequences seq
       INNER JOIN terms term
         ON term.id = seq.term_id
       WHERE seq.academic_year_id = $1
       ORDER BY term.sort_order, seq.sort_order`,
      [yearId]
    )
  ).rows;

  if (!periods.length) {
    throw httpError(
      'No assessment sequences are configured for this academic year.',
      422
    );
  }


  // ------------------------------------------------------------
  // STUDENT RESULTS
  // ------------------------------------------------------------

  const rr = (
    await q(
      `SELECT
         sub.id AS subject_id,
         sub.name,
         sub.max_mark,
         sub.coefficient,
         r.mark,
         r.sequence_id
       FROM results r
       INNER JOIN subjects sub
         ON sub.id = r.subject_id
       WHERE r.student_id = $1
         AND r.class_id = $2
         AND r.academic_year_id = $3
       ORDER BY sub.name, r.sequence_id`,
      [studentId, classId, yearId]
    )
  ).rows;


  // ------------------------------------------------------------
  // ORGANIZE SUBJECTS
  // ------------------------------------------------------------

  const subjects = {};

  for (const row of rr) {

    const subjectId = Number(row.subject_id);

    if (!subjects[subjectId]) {
      subjects[subjectId] = {
        name: row.name,
        max_mark: Number(row.max_mark),
        coefficient: Number(row.coefficient),
        marks: {}
      };
    }

    subjects[subjectId].marks[Number(row.sequence_id)] =
      Number(row.mark);
  }


  // ------------------------------------------------------------
  // ORGANIZE TERMS
  // ------------------------------------------------------------

  const termPeriods = {
    1: [],
    2: [],
    3: []
  };

  for (const period of periods) {

    const termOrder = Number(period.term_order);

    if (termPeriods[termOrder]) {
      termPeriods[termOrder].push(period);
    }
  }


  // ------------------------------------------------------------
  // LIMIT EACH TERM TO THE ORIGINAL TWO SEQUENCES
  // ------------------------------------------------------------

  for (const [termOrder, rows] of Object.entries(termPeriods)) {

    rows.sort(
      (a, b) =>
        Number(a.sort_order) - Number(b.sort_order)
    );

    termPeriods[termOrder] = rows.slice(0, 2);

    const names = {
      1: [
        'First Sequence',
        'Second Sequence'
      ],

      2: [
        'Third Sequence',
        'Fourth Sequence'
      ],

      3: [
        'Fifth Sequence',
        'Final Exam'
      ]
    }[termOrder] || [];

    termPeriods[termOrder].forEach((row, index) => {

      row.display_name =
        names[index] || row.name;

    });
  }


  // ------------------------------------------------------------
  // BUILD STUDENT REPORT TABLE
  // ------------------------------------------------------------

  let overallWeight = 0;
  let overallPossible = 0;
  let tableRows = '';


  for (const subject of Object.values(subjects)) {

    const termAverages = [];

    tableRows += `
      <tr>
        <td>
          ${escapeHtml(subject.name)}
        </td>
    `;


    // ----------------------------------------------------------
    // TERM RESULTS
    // ----------------------------------------------------------

    for (const rows of Object.values(termPeriods)) {

      const marks = [];


      for (const period of rows) {

        const mark =
          subject.marks[Number(period.id)] ?? null;

        marks.push(mark);

        tableRows += `
          <td>
            ${
              mark === null
                ? '—'
                : escapeHtml(
                    `${mark}/${subject.max_mark}`
                  )
            }
          </td>
        `;
      }


      // --------------------------------------------------------
      // TERM AVERAGE
      // --------------------------------------------------------

      const availableMarks =
        marks.filter(
          mark => mark !== null
        );

      const termAverage =
        availableMarks.length
          ? round2(
              availableMarks.reduce(
                (total, mark) => total + mark,
                0
              )
              /
              availableMarks.length
              /
              subject.max_mark
              *
              100
            )
          : null;

      termAverages.push(termAverage);


      tableRows += `
        <td>
          <b>
            ${
              termAverage === null
                ? '—'
                : `${termAverage}%`
            }
          </b>
        </td>
      `;
    }


    // ----------------------------------------------------------
    // ANNUAL AVERAGE
    // ----------------------------------------------------------

    const annualValues =
      termAverages.filter(
        value => value !== null
      );

    const annualAverage =
      annualValues.length
        ? round2(
            annualValues.reduce(
              (total, value) => total + value,
              0
            )
            /
            annualValues.length
          )
        : null;


    // ----------------------------------------------------------
    // OVERALL WEIGHTED AVERAGE
    // ----------------------------------------------------------

    if (annualAverage !== null) {

      overallWeight +=
        annualAverage * subject.coefficient;

      overallPossible +=
        100 * subject.coefficient;
    }


    // ----------------------------------------------------------
    // SUBJECT GRADE
    // ----------------------------------------------------------

    const subjectGrade =
      annualAverage === null
        ? {
            grade: 'Pending',
            evaluation: 'Pending'
          }
        : await grade(
            yearId,
            annualAverage
          );


    // ----------------------------------------------------------
    // ANNUAL AVG + GRADE COLUMNS
    // ----------------------------------------------------------

    tableRows += `
        <td>
          <b>
            ${
              annualAverage === null
                ? '—'
                : `${annualAverage}%`
            }
          </b>
        </td>

        <td>
          ${escapeHtml(
            subjectGrade.grade || 'Pending'
          )}
          ·
          ${escapeHtml(
            subjectGrade.evaluation || 'Pending'
          )}
        </td>

      </tr>
    `;
  }


  // ------------------------------------------------------------
  // STUDENT OVERALL ANNUAL AVERAGE
  // ------------------------------------------------------------

  const annualAverage =
    overallPossible > 0
      ? round2(
          overallWeight
          /
          overallPossible
          *
          100
        )
      : 0;


  const overallGrade =
    await grade(
      yearId,
      annualAverage
    );


  // ------------------------------------------------------------
  // CLASS RESULTS
  // ------------------------------------------------------------

  const classRows = (
    await q(
      `SELECT
         r.student_id,
         r.subject_id,
         r.sequence_id,
         r.mark,
         sub.max_mark,
         sub.coefficient
       FROM results r
       INNER JOIN subjects sub
         ON sub.id = r.subject_id
       INNER JOIN class_students cs
         ON cs.student_id = r.student_id
        AND cs.class_id = r.class_id
        AND cs.academic_year_id = r.academic_year_id
       WHERE r.class_id = $1
         AND r.academic_year_id = $2`,
      [classId, yearId]
    )
  ).rows;


  const classSubjects = {};


  for (const row of classRows) {

    const studentKey =
      Number(row.student_id);

    const subjectKey =
      Number(row.subject_id);


    if (!classSubjects[studentKey]) {
      classSubjects[studentKey] = {};
    }


    if (!classSubjects[studentKey][subjectKey]) {

      classSubjects[studentKey][subjectKey] = {

        max_mark: Number(row.max_mark),

        coefficient:
          Number(row.coefficient),

        marks: {}

      };
    }


    classSubjects[studentKey][subjectKey]
      .marks[Number(row.sequence_id)] =
        Number(row.mark);
  }


  // ------------------------------------------------------------
  // CLASS AVERAGES
  // ------------------------------------------------------------

  const classAverages = [];


  for (
    const studentSubjects
    of Object.values(classSubjects)
  ) {

    let weight = 0;
    let possible = 0;


    for (
      const subject
      of Object.values(studentSubjects)
    ) {

      const termAvgs = [];


      for (
        const rows
        of Object.values(termPeriods)
      ) {

        const marks = [];


        for (const period of rows) {

          if (
            subject.marks[
              Number(period.id)
            ] !== undefined
          ) {

            marks.push(
              subject.marks[
                Number(period.id)
              ]
            );
          }
        }


        if (marks.length) {

          termAvgs.push(
            marks.reduce(
              (total, mark) => total + mark,
              0
            )
            /
            marks.length
            /
            subject.max_mark
            *
            100
          );
        }
      }


      if (termAvgs.length) {

        weight +=
          (
            termAvgs.reduce(
              (total, value) => total + value,
              0
            )
            /
            termAvgs.length
          )
          *
          subject.coefficient;

        possible +=
          100 * subject.coefficient;
      }
    }


    if (possible > 0) {

      classAverages.push(
        weight / possible * 100
      );
    }
  }


  // ------------------------------------------------------------
  // CLASS AVERAGE + POSITION
  // ------------------------------------------------------------

  const classAverage =
    classAverages.length
      ? round2(
          classAverages.reduce(
            (total, value) => total + value,
            0
          )
          /
          classAverages.length
        )
      : 0;


  const position =
    1 +
    classAverages.filter(
      value => value > annualAverage
    ).length;


  // ------------------------------------------------------------
  // SCHOOL SETTINGS
  // ------------------------------------------------------------

  const settings =
    (
      await q(
        'SELECT * FROM school_settings WHERE id = 1'
      )
    ).rows[0]
    ||
    {
      school_name:
        'ATLANTIC BILINGUAL COLLEGE MABANDA',

      address: '',

      principal_name: ''
    };


  // ------------------------------------------------------------
  // SCHOOL LOGOS
  // ------------------------------------------------------------

  const logoPath =
    path.join(
      PUBLIC,
      'assets',
      'school-logo.jpeg'
    );

  let logoHtml = '';


  if (fs.existsSync(logoPath)) {

    const data =
      fs.readFileSync(
        logoPath
      ).toString('base64');


    logoHtml = `
      <img
        class="corner-logo logo-left"
        src="data:image/jpeg;base64,${data}"
        alt="School logo"
      >

      <img
        class="corner-logo logo-right"
        src="data:image/jpeg;base64,${data}"
        alt="School logo"
      >
    `;
  }


  // ------------------------------------------------------------
  // REPORT TABLE HEADER
  // ------------------------------------------------------------

  let headerHtml = `
    <tr>

      <th rowspan="2">
        Subject
      </th>
  `;


  for (
    const [termOrder, rows]
    of Object.entries(termPeriods)
  ) {

    const termName =
      Number(termOrder) === 1
        ? 'First Term'
        : Number(termOrder) === 2
          ? 'Second Term'
          : 'Third Term';


    headerHtml += `
      <th colspan="${rows.length + 1}">
        ${termName}
      </th>
    `;
  }


  // ------------------------------------------------------------
  // IMPORTANT:
  // ANNUAL AVG AND GRADE ARE ROWSPAN=2
  // ------------------------------------------------------------

  headerHtml += `
      <th rowspan="2">
        Annual Avg
      </th>

      <th rowspan="2">
        Grade
      </th>

    </tr>

    <tr>
  `;


  // ------------------------------------------------------------
  // SEQUENCE HEADERS
  // ------------------------------------------------------------

  for (
    const rows
    of Object.values(termPeriods)
  ) {

    for (const period of rows) {

      headerHtml += `
        <th>
          ${escapeHtml(
            period.display_name ||
            period.name
          )}
        </th>
      `;
    }


    headerHtml += `
      <th>
        ${
          rows.length > 1
            ? 'Term average'
            : 'Exam mark'
        }
      </th>
    `;
  }


  headerHtml += `
    </tr>
  `;


  // ------------------------------------------------------------
  // COMPLETE REPORT CARD HTML
  // ------------------------------------------------------------

  const html = `
    <!doctype html>

    <html>

      <head>

        <meta charset="utf-8">

        <style>

          body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #172033;
            font-size: 10px;
          }

          .watermark {
            position: fixed;
            top: 42%;
            left: 7%;
            width: 86%;
            text-align: center;
            transform: rotate(-28deg);
            font-size: 44px;
            font-weight: bold;
            color: rgba(16, 40, 70, 0.08);
            z-index: -1;
          }

          .corner-logo {
            position: fixed;
            top: 18px;
            width: 72px;
            height: 72px;
            object-fit: contain;
          }

          .logo-left {
            left: 18px;
          }

          .logo-right {
            right: 18px;
          }

          h1 {
            text-align: center;
            margin: 0;
          }

          h2 {
            text-align: center;
            font-size: 14px;
            font-weight: normal;
            margin: 4px 0 22px;
          }

          .meta {
            width: 100%;
            margin: 18px 0;
            border-collapse: collapse;
          }

          .meta td {
            padding: 5px;
            border-bottom: 1px solid #ddd;
          }

          .results {
            width: 100%;
            border-collapse: collapse;
          }

          .results th {
            background: #102846;
            color: #fff;
          }

          .results th,
          .results td {
            padding: 6px;
            border: 1px solid #ccd5e0;
            text-align: center;
          }

          .results th:first-child,
          .results td:first-child {
            text-align: left;
          }

          .summary {
            margin-top: 18px;
            line-height: 1.8;
          }

          .remarks {
            margin-top: 22px;
            padding: 12px;
            background: #f1f5f9;
          }

          .signatures {
            width: 100%;
            margin-top: 55px;
            border-collapse: collapse;
          }

          .signature {
            width: 45%;
            border-top: 1px solid #65758c;
            padding-top: 7px;
            vertical-align: top;
          }

        </style>

      </head>

      <body>

        ${logoHtml}

        <div class="watermark">
          ATLANTIC BILINGUAL COLLEGE
        </div>


        <h1>
          ${escapeHtml(settings.school_name)}
        </h1>


        <h2>
          ${escapeHtml(settings.address || '')}
          <br>

          Contact us at
          671385836 / 678628677

          <br>

          Annual Academic Report Card ·
          ${escapeHtml(student.academic_year)}
        </h2>


        <table class="meta">

          <tr>

            <td>
              <b>Student:</b>
              ${escapeHtml(student.full_name)}
            </td>

            <td>
              <b>Student ID:</b>
              ${escapeHtml(student.student_id)}
            </td>

          </tr>


          <tr>

            <td>
              <b>Matricule number:</b>
              ${escapeHtml(student.registration_number)}
            </td>

            <td>
              <b>Class:</b>
              ${escapeHtml(student.class_name)}
            </td>

          </tr>

        </table>


        <table class="results">

          ${headerHtml}

          ${tableRows}

        </table>


        <div class="summary">

          <b>Student average:</b>
          ${annualAverage}%

          &nbsp;

          <b>Class average:</b>
          ${classAverage}%

          &nbsp;

          <b>Position:</b>
          ${position} / ${classAverages.length}

          <br>

          <b>Grade:</b>
          ${escapeHtml(
            overallGrade.grade || 'Pending'
          )}

          ·

          ${escapeHtml(
            overallGrade.evaluation || 'Pending'
          )}

        </div>


        <div class="remarks">

          <b>General performance:</b>
          ${escapeHtml(
            await overview(
              yearId,
              annualAverage
            )
          )}

          <br><br>

          <b>Class master remarks:</b>
          _______________________________________________

          <br><br>

          <b>Principal remarks:</b>
          _________________________________________________

        </div>


        <table class="signatures">

          <tr>

            <td class="signature">
              Class Master Signature
            </td>

            <td style="width: 10%;">
            </td>

            <td class="signature">
              Principal Signature ·
              ${escapeHtml(
                settings.principal_name || ''
              )}
            </td>

          </tr>

        </table>

      </body>

    </html>
  `;


  return {
    html,
    annualAverage
  };
}

async function generateAnnual(studentId,classId,yearId){
  const {html}=await annualReportData(studentId,classId,yearId);
  const browser=await puppeteer.launch({
    headless:'new',
    executablePath:process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),
    args:['--no-sandbox','--disable-setuid-sandbox']
  });

  try{
    const page=await browser.newPage();
    await page.setContent(html,{waitUntil:'networkidle0'});

    const file=path.join(
      REPORT_DIR,
      `annual-report-${studentId}-${yearId}.pdf`
    );

    await page.pdf({
      path:file,
      format:'Letter',
      landscape:false,
      printBackground:true,
      margin:{
        top:'0.5in',
        right:'0.5in',
        bottom:'0.5in',
        left:'0.5in'
      }
    });

    return file;
  }finally{
    await browser.close();
  }
}

async function generateReport(user,studentId,classId,yearId,termId,sequenceId){
  if(!(await canAccessReports(user))){
    throw httpError(
      'Forbidden: report cards are not enabled for this account.',
      403
    );
  }

  await assertClassAccess(user,classId);

  const file=await generateAnnual(
    studentId,
    classId,
    yearId
  );

  return file;
}

async function generateClassZip(user,classId,yearId,termId,sequenceId){
  if(!(await canAccessReports(user))){
    throw httpError(
      'Forbidden: bulk report cards are not enabled for this account.',
      403
    );
  }

  await assertClassAccess(user,classId);

  const students=await academicStudents(
    user,
    classId,
    yearId
  );

  if(!students.length){
    throw httpError(
      'No active students found in this class.',
      404
    );
  }

  const zipFile=path.join(
    REPORT_DIR,
    `class-${classId}-${yearId}-${termId}-${sequenceId}.zip`
  );

  const output=fs.createWriteStream(zipFile);

  const archive=archiver('zip',{
    zlib:{level:9}
  });

  const done=new Promise((resolve,reject)=>{
    output.on('close',resolve);
    archive.on('error',reject);
  });

  archive.pipe(output);

  for(const s of students){
    const pdf=await generateReport(
      user,
      Number(s.id),
      classId,
      yearId,
      termId,
      sequenceId
    );

    archive.file(
      pdf,
      {
        name:`report-card-${s.student_id}.pdf`
      }
    );
  }

  await archive.finalize();
  await done;

  return zipFile;
}


// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------

app.post('/api/login',async(req,res,next)=>{
  try{
    const email=lowerEmail(req.body.email);
    const password=String(req.body.password||'');

    const r=await q(
      `SELECT
         u.id,
         u.password_hash,
         u.full_name,
         u.email,
         r.name AS role
       FROM users u
       INNER JOIN roles r ON r.id=u.role_id
       WHERE u.email=$1
         AND u.is_active=TRUE
       LIMIT 1`,
      [email]
    );

    const user=r.rows[0];

    const stored=String(
      user?.password_hash||''
    ).replace(/^\$2y\$/,'$2b$');

    if(
      !user ||
      !(await bcrypt.compare(password,stored))
    ){
      throw httpError(
        'Invalid email or password.',
        401
      );
    }

    await new Promise((resolve,reject)=>{
      req.session.regenerate(
        err=>err?reject(err):resolve()
      );
    });

    req.session.user={
      id:Number(user.id),
      full_name:user.full_name,
      email:user.email,
      role:user.role
    };

    req.session.csrf=
      crypto.randomBytes(32).toString('hex');

    json(res,{
      user:req.session.user,
      csrf:req.session.csrf
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/register/teacher',async(req,res,next)=>{
  try{
    const fullName=
      String(req.body.full_name||'').trim();

    const email=
      lowerEmail(req.body.email);

    const password=
      String(req.body.password||'');

    if(!fullName||fullName.length<2){
      throw httpError(
        "Enter the teacher's full name.",
        422
      );
    }

    if(
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ){
      throw httpError(
        'Enter a valid email address.',
        422
      );
    }

    if(password.length<8){
      throw httpError(
        'Password must contain at least 8 characters.',
        422
      );
    }

    const role=(
      await q(
        "SELECT id FROM roles WHERE name='teacher' LIMIT 1"
      )
    ).rows[0];

    if(!role){
      throw httpError(
        'Teacher role is not configured.',
        500
      );
    }

    const hash=await bcrypt.hash(
      password,
      10
    );

    try{
      const r=await q(
        `INSERT INTO users(
           role_id,
           full_name,
           email,
           password_hash,
           is_active
         )
         VALUES($1,$2,$3,$4,TRUE)
         RETURNING id`,
        [
          role.id,
          fullName,
          email,
          hash
        ]
      );

      json(
        res,
        {
          teacher:{
            id:Number(r.rows[0].id),
            full_name:fullName,
            email,
            role:'teacher'
          }
        },
        201
      );

    }catch(e){
      if(e.code==='23505'){
        throw httpError(
          'An account with this email already exists.',
          409
        );
      }

      throw e;
    }

  }catch(e){
    next(e);
  }
});

app.post('/api/logout',async(req,res,next)=>{
  try{
    requireCsrf(req);

    req.session.destroy(err=>{
      if(err)return next(err);

      json(res,{
        message:'Logged out.'
      });
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/me',async(req,res,next)=>{
  try{
    const user=requireUser(req);

    json(res,{
      user,
      csrf:req.session.csrf
    });

  }catch(e){
    next(e);
  }
});

app.get('/health',async(req,res,next)=>{
  try{
    await q('SELECT 1');

    res.json({
      status:'ok'
    });

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// GENERAL API
// ------------------------------------------------------------

app.get('/api/dashboard',async(req,res,next)=>{
  try{
    const user=requireUser(req);

    json(res,{
      dashboard:await dashboardFor(user)
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/students',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher',
        'class_master'
      ]
    );

    json(res,{
      students:await academicStudents(
        user,
        parseIntParam(req.query.class_id),
        parseIntParam(req.query.academic_year_id)
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/results',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher',
        'class_master'
      ]
    );

    json(res,{
      results:await academicResults(
        user,
        parseIntParam(req.query.class_id),
        parseIntParam(req.query.academic_year_id),
        parseIntParam(req.query.sequence_id),
        parseIntParam(req.query.term_id)
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/performance',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher',
        'class_master'
      ]
    );

    json(res,{
      performance:await academicPerformance(
        user,
        parseIntParam(req.query.class_id),
        parseIntParam(req.query.academic_year_id),
        parseIntParam(req.query.sequence_id),
        parseIntParam(req.query.term_id)
      )
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/results',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher'
      ]
    );

    requireCsrf(req);

    json(
      res,
      {
        result:await saveResult(
          req.body,
          user
        )
      },
      201
    );

  }catch(e){
    next(e);
  }
});

app.post('/api/results/submit',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher'
      ]
    );

    requireCsrf(req);

    json(res,{
      result:await submitResults(
        req.body,
        user
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/results/finalized',async(req,res,next)=>{
  try{
    requireRole(
      req,
      [
        'administrator',
        'teacher'
      ]
    );

    const r=await q(
      `SELECT *
       FROM result_finalizations
       WHERE academic_year_id=$1
         AND term_id=$2
         AND sequence_id=$3
       ORDER BY finalized_at DESC
       LIMIT 1`,
      [
        parseIntParam(
          req.query.academic_year_id
        ),
        parseIntParam(
          req.query.term_id
        ),
        parseIntParam(
          req.query.sequence_id
        )
      ]
    );

    json(res,{
      finalized:r.rows[0]||null
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/results/finalize',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const y=parseIntParam(
      req.body.academic_year_id
    );

    const t=parseIntParam(
      req.body.term_id
    );

    const s=parseIntParam(
      req.body.sequence_id
    );

    if(!y||!t||!s){
      throw httpError(
        'Academic year, term and sequence are required.',
        422
      );
    }

    await q(
      `INSERT INTO result_finalizations(
         academic_year_id,
         term_id,
         sequence_id,
         finalized_by
       )
       VALUES($1,$2,$3,$4)
       ON CONFLICT(
         academic_year_id,
         term_id,
         sequence_id
       )
       DO UPDATE SET
         finalized_by=EXCLUDED.finalized_by,
         finalized_at=CURRENT_TIMESTAMP,
         is_reopened=FALSE`,
      [
        y,
        t,
        s,
        user.id
      ]
    );

    json(res,{
      message:'Results finalized.'
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/results/reopen',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const y=parseIntParam(
      req.body.academic_year_id
    );

    const t=parseIntParam(
      req.body.term_id
    );

    const s=parseIntParam(
      req.body.sequence_id
    );

    if(!y||!t||!s){
      throw httpError(
        'Academic year, term and sequence are required.',
        422
      );
    }

    await tx(async c=>{
      await c.query(
        `INSERT INTO result_finalizations(
           academic_year_id,
           term_id,
           sequence_id,
           finalized_by,
           is_reopened
         )
         VALUES($1,$2,$3,$4,TRUE)
         ON CONFLICT(
           academic_year_id,
           term_id,
           sequence_id
         )
         DO UPDATE SET
           finalized_by=EXCLUDED.finalized_by,
           finalized_at=CURRENT_TIMESTAMP,
           is_reopened=TRUE`,
        [
          y,
          t,
          s,
          user.id
        ]
      );

      await c.query(
        `UPDATE results
         SET status='draft',
             updated_by=$1
         WHERE academic_year_id=$2
           AND term_id=$3
           AND sequence_id=$4
           AND status IN (
             'submitted',
             'approved',
             'locked'
           )`,
        [
          user.id,
          y,
          t,
          s
        ]
      );
    });

    json(res,{
      message:'Results reopened for editing.'
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/report-cards',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'class_master',
        'teacher'
      ]
    );

    requireCsrf(req);

    const b=req.body;

    const file=await generateReport(
      user,
      parseIntParam(b.student_id),
      parseIntParam(b.class_id),
      parseIntParam(b.academic_year_id),
      parseIntParam(b.term_id),
      parseIntParam(b.sequence_id)
    );

    res.download(
      file,
      `report-card-${parseIntParam(b.student_id)}.pdf`
    );

  }catch(e){
    next(e);
  }
});

app.post('/api/report-cards/bulk',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'class_master',
        'teacher'
      ]
    );

    requireCsrf(req);

    const b=req.body;

    const file=await generateClassZip(
      user,
      parseIntParam(b.class_id),
      parseIntParam(b.academic_year_id),
      parseIntParam(b.term_id),
      parseIntParam(b.sequence_id)
    );

    res.download(
      file,
      'class-report-cards.zip'
    );

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

app.get('/api/admin/students',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      `SELECT
         s.*,
         c.name AS class_name,
         ay.label AS academic_year
       FROM students s
       LEFT JOIN class_students cs
         ON cs.student_id=s.id
       LEFT JOIN classes c
         ON c.id=cs.class_id
       LEFT JOIN academic_years ay
         ON ay.id=cs.academic_year_id
       WHERE s.is_active=TRUE
       ORDER BY s.full_name`
    );

    json(res,{
      students:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/admin/students',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const b=req.body;

    const id=await tx(async c=>{
      const r=await c.query(
        `INSERT INTO students(
           student_id,
           registration_number,
           full_name,
           gender,
           date_of_birth,
           guardian_name,
           guardian_phone
         )
         VALUES($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [
          String(b.student_id||'').trim(),
          String(b.registration_number||'').trim(),
          String(b.full_name||'').trim(),
          b.gender||null,
          b.date_of_birth||null,
          b.guardian_name||null,
          b.guardian_phone||null
        ]
      );

      const sid=Number(
        r.rows[0].id
      );

      await c.query(
        `INSERT INTO class_students(
           class_id,
           student_id,
           academic_year_id
         )
         VALUES($1,$2,$3)`,
        [
          Number(b.class_id),
          sid,
          Number(b.academic_year_id)
        ]
      );

      return sid;
    });

    json(
      res,
      {
        student_id:id
      },
      201
    );

  }catch(e){
    next(e);
  }
});

app.delete('/api/admin/students/:id',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    await tx(async c=>{
      const s=(
        await c.query(
          `SELECT id
           FROM students
           WHERE id=$1
             AND is_active=TRUE
           LIMIT 1`,
          [req.params.id]
        )
      ).rows[0];

      if(!s){
        throw httpError(
          'Active student not found.',
          404
        );
      }

      await c.query(
        `UPDATE students
         SET is_active=FALSE
         WHERE id=$1`,
        [req.params.id]
      );

      await c.query(
        `INSERT INTO audit_logs(
           user_id,
           action,
           entity_type,
           entity_id,
           student_id,
           previous_value,
           new_value
         )
         VALUES(
           $1,
           'deactivated',
           'student',
           $2,
           $2,
           'active',
           'inactive'
         )`,
        [
          user.id,
          req.params.id
        ]
      );
    });

    json(res,{
      message:'Student deactivated.'
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/students/:id/history',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const student=(
      await q(
        'SELECT * FROM students WHERE id=$1 LIMIT 1',
        [req.params.id]
      )
    ).rows[0];

    if(!student){
      throw httpError(
        'Student not found.',
        404
      );
    }

    json(res,{
      student,
      history:await history(
        Number(req.params.id)
      )
    });

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// ADMIN CLASSES
// ------------------------------------------------------------

app.post('/api/admin/classes',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const r=await q(
      `INSERT INTO classes(
         academic_year_id,
         name,
         class_master_id
       )
       VALUES($1,$2,$3)
       RETURNING id`,
      [
        parseIntParam(
          req.body.academic_year_id
        ),
        String(
          req.body.name||''
        ).trim(),
        req.body.class_master_id
          ? Number(req.body.class_master_id)
          : null
      ]
    );

    json(
      res,
      {
        class_id:Number(
          r.rows[0].id
        )
      },
      201
    );

  }catch(e){
    next(e);
  }
});

app.put('/api/admin/classes/:id',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const existing=(
      await q(
        `SELECT *
         FROM classes
         WHERE id=$1
           AND is_active=TRUE
         LIMIT 1`,
        [req.params.id]
      )
    ).rows[0];

    if(!existing){
      throw httpError(
        'Active class not found.',
        404
      );
    }

    const name=
      req.body.name &&
      String(req.body.name).trim()
        ? String(
            req.body.name
          ).trim()
        : existing.name;

    const master=
      Object.prototype.hasOwnProperty.call(
        req.body,
        'class_master_id'
      )
        ? (
            req.body.class_master_id
              ? Number(
                  req.body.class_master_id
                )
              : null
          )
        : existing.class_master_id;

    const year=
      Object.prototype.hasOwnProperty.call(
        req.body,
        'academic_year_id'
      )
        ? Number(
            req.body.academic_year_id
          )
        : Number(
            existing.academic_year_id
          );

    await q(
      `UPDATE classes
       SET name=$1,
           class_master_id=$2,
           academic_year_id=$3
       WHERE id=$4`,
      [
        name,
        master,
        year,
        req.params.id
      ]
    );

    await q(
      `INSERT INTO audit_logs(
         user_id,
         action,
         entity_type,
         entity_id,
         previous_value,
         new_value
       )
       VALUES(
         $1,
         'updated',
         'class',
         $2,
         $3,
         $4
       )`,
      [
        user.id,
        req.params.id,
        JSON.stringify({
          name:existing.name,
          class_master_id:
            existing.class_master_id
        }),
        JSON.stringify({
          name,
          class_master_id:master
        })
      ]
    );

    json(res,{
      message:'Class updated.'
    });

  }catch(e){
    next(e);
  }
});

app.delete('/api/admin/classes/:id',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    await tx(async c=>{
      const cls=(
        await c.query(
          `SELECT id
           FROM classes
           WHERE id=$1
             AND is_active=TRUE
           LIMIT 1`,
          [req.params.id]
        )
      ).rows[0];

      if(!cls){
        throw httpError(
          'Active class not found.',
          404
        );
      }

      await c.query(
        `UPDATE classes
         SET is_active=FALSE
         WHERE id=$1`,
        [req.params.id]
      );

      await c.query(
        `UPDATE teacher_subject_classes
         SET is_active=FALSE
         WHERE class_id=$1`,
        [req.params.id]
      );

      await c.query(
        `INSERT INTO audit_logs(
           user_id,
           action,
           entity_type,
           entity_id,
           previous_value,
           new_value
         )
         VALUES(
           $1,
           'deactivated',
           'class',
           $2,
           'active',
           'inactive'
         )`,
        [
          user.id,
          req.params.id
        ]
      );
    });

    json(res,{
      message:'Class deactivated.'
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/classes/:id/classlist',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const cls=(
      await q(
        `SELECT
           id,
           name,
           academic_year_id
         FROM classes
         WHERE id=$1
           AND is_active=TRUE
         LIMIT 1`,
        [req.params.id]
      )
    ).rows[0];

    if(!cls){
      throw httpError(
        'Class not found.',
        404
      );
    }

    const year=parseIntParam(
      req.query.academic_year_id,
      Number(cls.academic_year_id)
    );

    const students=(
      await q(
        `SELECT
           s.student_id,
           s.registration_number,
           s.full_name,
           s.gender,
           s.date_of_birth,
           s.guardian_name,
           s.guardian_phone,
           c.name AS class_name,
           ay.label AS academic_year
         FROM students s
         INNER JOIN class_students cs
           ON cs.student_id=s.id
         INNER JOIN classes c
           ON c.id=cs.class_id
         INNER JOIN academic_years ay
           ON ay.id=cs.academic_year_id
         WHERE cs.class_id=$1
           AND cs.academic_year_id=$2
           AND s.is_active=TRUE
         ORDER BY s.full_name`,
        [
          req.params.id,
          year
        ]
      )
    ).rows;

    json(res,{
      class:cls,
      students
    });

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// ADMIN TEACHERS / SETTINGS / ANALYTICS
// ------------------------------------------------------------

app.get('/api/admin/teachers',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         (
           SELECT COUNT(*)
           FROM teacher_subject_classes a
           WHERE a.teacher_id=u.id
             AND a.is_active=TRUE
         ) AS assignment_count
       FROM users u
       INNER JOIN roles r
         ON r.id=u.role_id
       WHERE r.name='teacher'
         AND u.is_active=TRUE
       ORDER BY u.full_name`
    );

    json(res,{
      teachers:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/admin/teachers',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const name=
      String(
        req.body.full_name||''
      ).trim();

    const email=
      lowerEmail(
        req.body.email
      );

    const password=
      String(
        req.body.password||''
      );

    if(
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length<8
    ){
      throw httpError(
        'Provide a name, valid email, and password of at least 8 characters.',
        422
      );
    }

    const role=(
      await q(
        "SELECT id FROM roles WHERE name='teacher' LIMIT 1"
      )
    ).rows[0];

    if(!role){
      throw httpError(
        'Teacher role is not configured.',
        500
      );
    }

    try{
      const r=await q(
        `INSERT INTO users(
           role_id,
           full_name,
           email,
           password_hash,
           is_active
         )
         VALUES($1,$2,$3,$4,TRUE)
         RETURNING id`,
        [
          role.id,
          name,
          email,
          await bcrypt.hash(
            password,
            10
          )
        ]
      );

      json(
        res,
        {
          teacher_id:Number(
            r.rows[0].id
          )
        },
        201
      );

    }catch(e){
      if(e.code==='23505'){
        throw httpError(
          'An account with this email already exists.',
          409
        );
      }

      throw e;
    }

  }catch(e){
    next(e);
  }
});

app.delete('/api/admin/teachers/:id',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    await tx(async c=>{
      if(
        !(
          await c.query(
            `SELECT u.id
             FROM users u
             INNER JOIN roles r
               ON r.id=u.role_id
             WHERE u.id=$1
               AND r.name='teacher'
               AND u.is_active=TRUE`,
            [req.params.id]
          )
        ).rowCount
      ){
        throw httpError(
          'Active teacher not found.',
          404
        );
      }

      await c.query(
        `UPDATE users
         SET is_active=FALSE
         WHERE id=$1`,
        [req.params.id]
      );

      await c.query(
        `UPDATE teacher_subject_classes
         SET is_active=FALSE
         WHERE teacher_id=$1`,
        [req.params.id]
      );

      await c.query(
        `INSERT INTO audit_logs(
           user_id,
           action,
           entity_type,
           entity_id
         )
         VALUES(
           $1,
           'deactivated',
           'teacher',
           $2
         )`,
        [
          user.id,
          req.params.id
        ]
      );
    });

    json(res,{
      message:'Teacher account deactivated.'
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/class-masters',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      `SELECT DISTINCT
         u.id,
         u.full_name,
         u.email,
         r.name AS role
       FROM users u
       INNER JOIN roles r
         ON r.id=u.role_id
       WHERE r.name IN(
         'teacher',
         'class_master'
       )
       AND u.is_active=TRUE
       ORDER BY u.full_name`
    );

    json(res,{
      class_masters:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/settings',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      'SELECT * FROM school_settings WHERE id=1'
    );

    json(res,{
      settings:r.rows[0]
    });

  }catch(e){
    next(e);
  }
});

app.put('/api/admin/settings',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const allowed=[
      'school_name',
      'motto',
      'address',
      'phone',
      'email',
      'website',
      'principal_name',
      'ranking_enabled',
      'ranking_method',
      'display_format',
      'teacher_report_card_access',
      'excellent_message',
      'good_message',
      'fail_message'
    ];

    const updates=Object.fromEntries(
      Object.entries(req.body)
        .filter(
          ([k])=>allowed.includes(k)
        )
    );

    if(!Object.keys(updates).length){
      throw httpError(
        'No valid settings supplied.',
        422
      );
    }

    const keys=Object.keys(
      updates
    );

    const sets=keys
      .map(
        (k,i)=>`${k}=$${i+1}`
      )
      .join(',');

    await q(
      `UPDATE school_settings
       SET ${sets}
       WHERE id=1`,
      keys.map(
        k=>updates[k]
      )
    );

    json(res,{
      message:'School settings updated.'
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/grading',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      `SELECT *
       FROM grading_scales
       WHERE academic_year_id=$1
       ORDER BY minimum_percentage DESC`,
      [
        parseIntParam(
          req.query.academic_year_id
        )
      ]
    );

    json(res,{
      grading_scales:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.post('/api/admin/grading',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    requireCsrf(req);

    const b=req.body;

    const r=await q(
      `INSERT INTO grading_scales(
         academic_year_id,
         grade,
         minimum_percentage,
         maximum_percentage,
         evaluation
       )
       VALUES($1,$2,$3,$4,$5)
       RETURNING id`,
      [
        Number(
          b.academic_year_id
        ),
        String(
          b.grade||''
        ).trim(),
        Number(
          b.minimum_percentage
        ),
        Number(
          b.maximum_percentage
        ),
        String(
          b.evaluation||''
        ).trim()
      ]
    );

    json(
      res,
      {
        grading_scale_id:Number(
          r.rows[0].id
        )
      },
      201
    );

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/audit',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    const r=await q(
      `SELECT
         a.*,
         u.full_name AS actor_name,
         st.full_name AS student_name,
         st.student_id AS student_number,
         sub.name AS subject_name
       FROM audit_logs a
       INNER JOIN users u
         ON u.id=a.user_id
       LEFT JOIN students st
         ON st.id=a.student_id
       LEFT JOIN subjects sub
         ON sub.id=a.subject_id
       ORDER BY a.created_at DESC
       LIMIT 200`
    );

    json(res,{
      audit:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/analytics',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    json(res,{
      analytics:await analyticsDashboard(
        parseIntParam(
          req.query.academic_year_id
        ),
        parseIntParam(
          req.query.sequence_id
        ),
        parseNullableInt(
          req.query.class_id
        ),
        parseNullableInt(
          req.query.subject_id
        ),
        parseNullableInt(
          req.query.term_id
        )
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/reports',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    json(res,{
      reports:await analyticsStudentReports(
        parseIntParam(
          req.query.academic_year_id
        ),
        parseIntParam(
          req.query.term_id
        ),
        parseIntParam(
          req.query.sequence_id
        ),
        parseNullableInt(
          req.query.class_id
        ),
        String(
          req.query.search||''
        ).trim()
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/submitted-reports',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    json(res,{
      reports:await analyticsSubmitted(
        parseIntParam(
          req.query.academic_year_id
        ),
        parseIntParam(
          req.query.term_id
        ),
        parseIntParam(
          req.query.sequence_id
        ),
        parseNullableInt(
          req.query.teacher_id
        ),
        parseNullableInt(
          req.query.class_id
        ),
        parseNullableInt(
          req.query.subject_id
        ),
        String(
          req.query.search||''
        ).trim()
      )
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/admin/subject-performance',async(req,res,next)=>{
  try{
    requireRole(
      req,
      ['administrator']
    );

    json(res,{
      performance:await analyticsSubject(
        parseIntParam(
          req.query.subject_id
        ),
        parseIntParam(
          req.query.academic_year_id
        ),
        parseIntParam(
          req.query.sequence_id
        )
      )
    });

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// SHARED API
// ------------------------------------------------------------

app.get('/api/classes',async(req,res,next)=>{
  try{
    const user=requireUser(req);

    const ids=await classIdsFor(
      user
    );

    if(!ids.length){
      return json(res,{
        classes:[]
      });
    }

    const r=await q(
      `SELECT
         c.*,
         ay.label AS academic_year,
         u.full_name AS class_master_name
       FROM classes c
       INNER JOIN academic_years ay
         ON ay.id=c.academic_year_id
       LEFT JOIN users u
         ON u.id=c.class_master_id
       WHERE c.id=ANY($1::int[])
       ORDER BY c.name`,
      [ids]
    );

    json(res,{
      classes:r.rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/subjects',async(req,res,next)=>{
  try{
    const user=requireRole(
      req,
      [
        'administrator',
        'teacher',
        'class_master'
      ]
    );

    let sql=
      'SELECT DISTINCT s.* FROM subjects s';

    let params=[];

    if(user.role==='teacher'){
      sql+=`
        INNER JOIN teacher_subject_classes a
          ON a.subject_id=s.id
        WHERE a.teacher_id=$1
          AND a.is_active=TRUE
      `;

      params=[
        user.id
      ];

    }else{
      sql+=`
        WHERE s.is_active=TRUE
      `;
    }

    sql+=`
      ORDER BY s.name
    `;

    json(res,{
      subjects:(await q(
        sql,
        params
      )).rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/academic-years',async(req,res,next)=>{
  try{
    requireUser(req);

    json(res,{
      academic_years:(
        await q(
          'SELECT * FROM academic_years ORDER BY label DESC'
        )
      ).rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/terms',async(req,res,next)=>{
  try{
    requireUser(req);

    json(res,{
      terms:(
        await q(
          `SELECT *
           FROM terms
           WHERE academic_year_id=$1
           ORDER BY sort_order`,
          [
            parseIntParam(
              req.query.academic_year_id
            )
          ]
        )
      ).rows
    });

  }catch(e){
    next(e);
  }
});

app.get('/api/sequences',async(req,res,next)=>{
  try{
    requireUser(req);

    const year=parseIntParam(
      req.query.academic_year_id
    );

    const term=
      req.query.term_id===undefined
        ? null
        : parseIntParam(
            req.query.term_id
          );

    let rows;

    if(term!==null){
      rows=(
        await q(
          `SELECT *
           FROM sequences
           WHERE academic_year_id=$1
             AND term_id=$2
           ORDER BY sort_order`,
          [
            year,
            term
          ]
        )
      ).rows;
    }else{
      rows=(
        await q(
          `SELECT *
           FROM sequences
           WHERE academic_year_id=$1
           ORDER BY sort_order`,
          [
            year
          ]
        )
      ).rows;
    }

    const allowed={
      1:[
        'First Sequence',
        'Second Sequence'
      ],
      2:[
        'Third Sequence',
        'Fourth Sequence'
      ],
      3:[
        'Fifth Sequence',
        'Final Exam'
      ]
    };

    if(
      term!==null &&
      allowed[term]
    ){
      rows=rows.filter(
        r=>allowed[term].includes(
          r.name
        )
      );

    }else if(term===null){
      const names=
        Object.values(allowed).flat();

      rows=rows.filter(
        r=>names.includes(
          r.name
        )
      );
    }

    rows.sort(
      (a,b)=>
        Number(a.sort_order)-
        Number(b.sort_order)
    );

    json(res,{
      sequences:rows
    });

  }catch(e){
    next(e);
  }
});


// ------------------------------------------------------------
// ADMIN RESULT TRANSITIONS
// ------------------------------------------------------------

app.post(
  '/api/admin/results/:id/:target(approve|lock|unlock)',
  async(req,res,next)=>{
    try{
      const user=requireRole(
        req,
        ['administrator']
      );

      requireCsrf(req);

      const target=
        req.params.target==='unlock'
          ? 'approved_from_locked'
          : req.params.target;

      json(res,{
        result:await transitionResult(
          Number(req.params.id),
          target,
          user
        )
      });

    }catch(e){
      next(e);
    }
  }
);


// ------------------------------------------------------------
// STATIC FRONTEND
// ------------------------------------------------------------

app.use(
  express.static(PUBLIC)
);

app.get('*',(req,res,next)=>{
  if(
    req.path.startsWith('/api/')
  ){
    return next();
  }

  res.sendFile(
    path.join(
      PUBLIC,
      'index.html'
    )
  );
});


// ------------------------------------------------------------
// ERROR HANDLER
// ------------------------------------------------------------

app.use((err,req,res,next)=>{
  const status=Number(
    err.status||500
  );

  if(res.headersSent){
    return next(err);
  }

  if(status>=500){
    console.error(err);
  }

  res.status(status).json({
    error:
      err.message ||
      'Internal server error.'
  });
});


// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------

app.listen(
  PORT,
  async()=>{
    try{
      await q('SELECT 1');

      console.log(
        `Mabanda Node.js server listening on http://localhost:${PORT}`
      );

    }catch(e){
      console.error(
        'Database connection failed:',
        e.message
      );
    }
  }
);