const express = require('express');
const fs = require('fs');
const cors = require('cors');  // Import cors package
const users = require('./MOCK_DATA.json');
const job = require('./linkedInJobs.json');
const jobdetails = require('./linkedInJobsWithDetails.json');
const app = express();

const PORT = 8000;

// Use CORS middleware globally
app.use(cors());  // Enable CORS for all routes
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.get("/users", (req, res) => {
    const html = `
    <ul>
    ${users.map((user) => `<li>${user.first_name}</li>`).join("")}
    </ul>`;
    return res.send(html);
});

app.get("/api/users", (req, res) => {
    return res.json(users);
});

app.get("/api/job-listing", (req, res) => {
    let { page, limit } = req.query;

    // Convert to numbers and provide default values
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 8;

    // Calculate total jobs and pages
    const totalJobs = job.length;
    const totalPages = Math.ceil(totalJobs / limit);

    // Ensure the page is within valid range
    if (page > totalPages) {
        return res.status(404).json({ message: "Page not found" });
    }

    // Calculate start and end indices
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Slice the job list to return only the required jobs
    const paginatedJobs = job.slice(startIndex, endIndex);

    res.json({
        totalJobs,
        totalPages,
        currentPage: page,
        jobsPerPage: limit,
        jobs: paginatedJobs
    });
});

app.post("/api/job-details/:id", (req, res) => {
    const jobId = Number(req.params.id);
    const jobData = jobdetails.find((j) => j.id === jobId);
    if (!jobData) {
        return res.status(404).json({ message: "Job not found" });
    }
    return res.json(jobData);
});

// filter location
app.post("/api/job-location", (req, res) => {
    
    const { location ,tech} = req.body; 

    if (!location || ! tech) {
        return res.status(400).json({ error: "Location is required" });
    }

    let result = job.filter((job) =>
        job.Location.toLowerCase().includes(location.toLowerCase())
    );
    let result2 = job.filter((job) =>
        job.Location.toLowerCase().includes(location.toLowerCase())
    );

    console.log("Filtered Jobs:", result);
    return res.json(result);
});


// filter tech stack
app.post("/api/job-tech-stack", (req, res) => {
    const jobId = Number(req.params.id);
    const jobData = jobdetails.find((j) => j.id === jobId);
    if (!jobData) {
        return res.status(404).json({ message: "Job not found" });
    }
    return res.json(jobData);
});

// filter Remote Job Opportunities
app.post("/api/remote-job", (req, res) => {
    const jobId = Number(req.params.id);
    const jobData = jobdetails.find((j) => j.id === jobId);
    if (!jobData) {
        return res.status(404).json({ message: "Job not found" });
    }
    return res.json(jobData);
});

app.route("/api/users/:id").get((req, res) => {
    const id = Number(req.params.id);
    const userdata = users.find((user) => user.id === id);
    return res.json(userdata);
}).patch((req, res) => {
    // edit with id
    return res.json({ status: "pending" });
}).delete((req, res) => {
    const id = Number(req.params.id);
    const userdelete = users.findIndex((user) => user.id === id);
    if (userdelete === -1) {
        return res.status(404).json({ status: "failure", message: "User not found" });
    }
    return res.json({ status: "success", userdelete });
});

app.post("/api/users", (req, res) => {
    const body = req.body;
    users.push({ ...body, id: users.length + 1 });
    fs.writeFile("./MOCK_DATA.json", JSON.stringify(users), (err, data) => {
        return res.json({ status: "success", id: users.length + 1 });
    });
});

app.listen(PORT, () => {
    console.log(`server start at PORT : ${PORT}`);
});
