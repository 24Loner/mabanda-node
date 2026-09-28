const { getStore } = require('@netlify/blobs');

const JOB_STORE = 'mabanda-report-jobs';
const FILE_STORE = 'mabanda-report-files';

const blobOptions = {
  siteID: process.env.NETLIFY_SITE_ID || '1db0dde0-df6d-4d0d-bf01-914052b0d52d',
  token: process.env.NETLIFY_AUTH_TOKEN
};

function jobsStore() {
  return getStore(JOB_STORE, blobOptions);
}

function filesStore() {
  return getStore(FILE_STORE, blobOptions);
}

async function saveJob(job) {
  await jobsStore().setJSON(job.id, job);
  return job;
}

async function getJob(jobId) {
  return jobsStore().get(jobId, { type: 'json' });
}

async function deleteJob(jobId) {
  await jobsStore().delete(jobId);
}

async function saveZip(jobId, buffer) {
  await filesStore().set(jobId, buffer, {
    metadata: {
      contentType: 'application/zip'
    }
  });
}

async function getZip(jobId) {
  return filesStore().get(jobId, {
    type: 'stream'
  });
}

async function deleteZip(jobId) {
  await filesStore().delete(jobId);
}

module.exports = {
  saveJob,
  getJob,
  deleteJob,
  saveZip,
  getZip,
  deleteZip
};