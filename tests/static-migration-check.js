
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'server.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'public','app.js'),'utf8');
const forbidden=/\b(mysql|mysqli|PDO|MariaDB|AUTO_INCREMENT|ON DUPLICATE KEY UPDATE|LAST_INSERT_ID)\b/i;
if(forbidden.test(source)) throw new Error('Found a MySQL/PHP database construct in runtime source.');
const routes=[
'/api/login','/api/register/teacher','/api/logout','/api/me','/api/dashboard','/api/results','/api/results/submit',
'/api/students','/api/admin/students','/api/performance','/api/admin/analytics','/api/admin/reports','/api/admin/submitted-reports',
'/api/admin/subject-performance','/api/report-cards','/api/report-cards/bulk','/api/admin/classes','/api/admin/subjects',
'/api/admin/assignments','/api/admin/teachers','/api/admin/class-masters','/api/admin/settings','/api/admin/grading','/api/admin/audit',
'/api/classes','/api/subjects','/api/academic-years','/api/terms','/api/sequences','/api/results/finalized','/api/results/finalize','/api/results/reopen','/api/admin/results/'
];
for(const route of routes){if(!source.includes(route)) throw new Error(`Missing route family: ${route}`);}
console.log('Static migration checks passed.');
