import reportJobs from "../report-jobs.js";

const {
  getJob,
  getZip
} = reportJobs;

export default async function(req) {
  try {
    const url = new URL(req.url);

    const jobId =
      String(url.searchParams.get("jobId") || "").trim();

    const token =
      String(url.searchParams.get("token") || "").trim();

    if (!jobId || !token) {
      return new Response(
        "Missing download credentials.",
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    const job = await getJob(jobId);

    if (!job) {
      return new Response(
        "Report job not found.",
        {
          status: 404,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    if (
      !job.downloadToken ||
      job.downloadToken !== token
    ) {
      return new Response(
        "Invalid download credentials.",
        {
          status: 403,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    if (
      job.expiresAt &&
      Date.now() > Date.parse(job.expiresAt)
    ) {
      return new Response(
        "This report download has expired.",
        {
          status: 410,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    if (job.status !== "ready") {
      return new Response(
        `Report is not ready. Current status: ${job.status}`,
        {
          status: 409,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    const zipStream = await getZip(jobId);

    if (!zipStream) {
      return new Response(
        "Report ZIP is no longer available.",
        {
          status: 404,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    const filename =
      job.filename ||
      `class-report-cards-${job.classId}.zip`;

    return new Response(
      zipStream,
      {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition":
            `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-store",
          "X-Report-Job-Id": jobId
        }
      }
    );

  } catch (error) {
    console.error(
      "[REPORT DOWNLOAD] Failed:",
      error
    );

    return new Response(
      "Unable to download report cards.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
}
