const fs = require('fs');

const { generateClassZip } = require('../../server');

const {
  getJob,
  saveJob,
  saveZip
} = require('../report-jobs');

exports.config = {
  background: true
};

exports.handler = async function(event) {
  let job = null;

  try {
    const body = JSON.parse(
      event.body || '{}'
    );

    const jobId =
      String(body.jobId || '');

    const workerToken =
      String(body.workerToken || '');

    if(!jobId || !workerToken){
      console.error(
        '[REPORT JOB] Missing job ID or worker token.'
      );

      return;
    }

    job=await getJob(jobId);

    if(!job){
      console.error(
        `[REPORT JOB] Job not found: ${jobId}`
      );

      return;
    }

    if(
      !job.workerToken ||
      job.workerToken!==workerToken
    ){
      console.error(
        `[REPORT JOB] Invalid worker token: ${jobId}`
      );

      return;
    }

    job.status='processing';

    job.startedAt=
      new Date().toISOString();

    job.error=null;
    job.completedStudents=0;

    await saveJob(job);

    console.log(
      `[REPORT JOB] Starting ${jobId} for class ${job.classId}`
    );

    const user={
      id:Number(job.userId),
      full_name:job.userFullName || '',
      email:job.userEmail || '',
      role:job.userRole
    };

    const zipFile=
      await generateClassZip(
        user,
        Number(job.classId),
        Number(job.academicYearId),
        Number(job.termId),
        Number(job.sequenceId),

        async progress => {
          job.status='processing';

          job.completedStudents=
            Number(
              progress.completedStudents || 0
            );

          job.totalStudents=
            Number(
              progress.totalStudents ||
              job.totalStudents ||
              0
            );

          job.currentStudentId=
            progress.studentId || null;

          job.currentStudentName=
            progress.studentName || null;

          job.updatedAt=
            new Date().toISOString();

          await saveJob(job);

          console.log(
            `[REPORT JOB] ${jobId}: ${job.completedStudents}/${job.totalStudents} - ${job.currentStudentId || ''}`
          );
        }
      );

    const zip=
      fs.readFileSync(zipFile);

    console.log(
      `[REPORT JOB] ZIP generated: ${zip.length} bytes`
    );

    await saveZip(
      jobId,
      zip
    );

    job.status='ready';

    job.completedAt=
      new Date().toISOString();

    job.completedStudents=
      Number(job.totalStudents || 0);

    job.size=
      zip.length;

    job.filename=
      `class-report-cards-${job.classId}.zip`;

    job.currentStudentId=null;
    job.currentStudentName=null;
    job.error=null;

    await saveJob(job);

    console.log(
      `[REPORT JOB] Completed successfully: ${jobId}`
    );

  }catch(error){

    console.error(
      '[REPORT JOB] Failed:',
      error
    );

    if(job){

      try{

        job.status='failed';

        job.failedAt=
          new Date().toISOString();

        job.error=
          error && error.message
            ? error.message
            : 'Report generation failed.';

        await saveJob(job);

      }catch(saveError){

        console.error(
          '[REPORT JOB] Could not save failed status:',
          saveError
        );

      }

    }

  }
};
