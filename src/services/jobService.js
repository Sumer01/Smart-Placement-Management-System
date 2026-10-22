import API from "./api";

export const getPublicJobs = async () => {
  const response = await API.get("/public/jobs");
  return response.data;
};

export const getAllJobs = async () => {
  const response = await API.get("/jobs/");
  return response.data;
};

export const getJobById = async (id) => {
  const response = await API.get(`/jobs/${id}`);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await API.post("/jobs/", jobData);
  return response.data;
};

export const applyForJob = async (jobId) => {
  const response = await API.post("/applications/apply", { job_id: jobId });
  return response.data;
};

export const getMyApplications = async () => {
  const response = await API.get("/applications/my-applications");
  return response.data;
};
