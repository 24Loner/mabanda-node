const {
  getJob,
  getZip
} = require('../report-jobs');

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};

    const jobId =
      String(params.jobId || '').trim();

    const token =
      String(params.token || '').trim();

    if (!jobId || !token) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: 'Missing download credentials.'
      };
    }

    const job = await getJob(jobId);

    if (!job) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: 'Report job not found.'
      };
    }

    if (
      !job.downloadToken ||
      job.downloadToken !== token
    ) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: 'Invalid download credentials.'
      };
    }

    if (
      job.expiresAt &&
      Date.now() > Date.parse(job.expiresAt)
    ) {
      return {
        statusCode: 410,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: 'This report download has expired.'
      };
    }

    if (job.status !== 'ready') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: `Report is not ready. Current status: ${job.status}`
      };
    }

    const zipStream = await getZip(jobId);

    if (!zipStream) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: 'Report ZIP is no longer available.'
      };
    }

    const chunks = [];

    for await (const chunk of zipStream) {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }

    const zipBuffer = Buffer.concat(chunks);

    const filename =
      job.filename ||
      `class-report-cards-${job.classId}.zip`;

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition':
          `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'private, no-store',
        'X-Report-Job-Id': jobId
      },
      body: zipBuffer.toString('base64')
    };

  } catch (error) {
    console.error(
      '[REPORT DOWNLOAD] Failed:',
      error
    );

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: 'Unable to download report cards.'
    };
  }
};