const axios = require("axios");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");
const fs = require("fs");

async function fetchJobs() {
    let url = "https://www.linkedin.com/jobs/react-js-developer-jobs-navi-mumbai/?currentJobId=4174200994&originalSubdomain=in";
    const linkedinJobs = [];
    
    try {
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }, // Prevent getting blocked
        });
        
        const html = response.data;
        const $ = cheerio.load(html);

        // Get today's date
        const today = new Date();
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        $("li").each((index, element) => {
            const jobTitle = $(element).find("h3.base-search-card__title").text().trim();
            const company = $(element).find("h4.base-search-card__subtitle").text().trim();
            const location = $(element).find("span.job-search-card__location").text().trim();
            const link = $(element).find("a.base-card__full-link").attr("href");
            const postedDate = $(element).find("time").text().trim(); // e.g., "7 hours ago"
            const dateTimeAttr = $(element).find("time").attr("datetime"); // e.g., "2025-03-06"

            if (jobTitle && company && link && dateTimeAttr) {
                const jobDate = new Date(dateTimeAttr);
                const timeDifference = today - jobDate;

                if (timeDifference <= THIRTY_DAYS_MS) {
                    linkedinJobs.push({
                        id: linkedinJobs.length + 1,
                        Title: jobTitle,
                        Company: company,
                        Location: location,
                        Link: link,
                        Posted: postedDate,
                        DateTime: dateTimeAttr,
                        Details: null,  // Placeholder for job details
                    });
                }
            }
        });

        console.log(`Scraping complete. ${linkedinJobs.length} jobs found within the last 30 days.`);

        if (linkedinJobs.length > 0) {

            // Fetch details for each job link
            for (let job of linkedinJobs) {
                job.Details = await fetchJobDetails(job.Link);
            }
            const csv = new ObjectsToCsv(linkedinJobs);
            await csv.toDisk("./linkedInJobs.csv");
            console.log("CSV file saved successfully.");

            // Save as JSON
            fs.writeFileSync("./linkedInJobs.json", JSON.stringify(linkedinJobs, null, 2));
            console.log("JSON file saved successfully.");

            // Save as JSON
            fs.writeFileSync("./linkedInJobsWithDetails.json", JSON.stringify(linkedinJobs, null, 2));
            console.log("JSON file with job details saved successfully.");
        } else {
            console.log("No jobs found in the last 30 days.");
        }
    } catch (error) {
        console.error("Error fetching job listings:", error.message);
    }
}

// Function to extract job details from the job posting page
async function fetchJobDetails(jobUrl) {
    try {
        const response = await axios.get(jobUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract the full job description text
        const jobDescription = $("div.show-more-less-html__markup").text().trim();

        let aboutCompany = "";
        $("h3, h2, strong").each((index, element) => {
            const headingText = $(element).text().trim().toLowerCase();

            if (headingText.includes("about us") || headingText.includes("about the company") || headingText.includes("who we are")) {
                aboutCompany = $(element).nextUntil("h3, h2, strong").text().trim();
            }
        });

        // Extract "Your Key Responsibilities"
        let responsibilities = [];
        $("h3, h2, strong").each((index, element) => {
            const headingText = $(element).text().trim().toLowerCase();

            if (headingText.includes("responsibilities") || headingText.includes("your key responsibilities")) {
                let responsibilityText = $(element).nextUntil("h3, h2, strong").text().trim();
                responsibilities = responsibilityText.split("\n").map(line => line.trim()).filter(line => line);
            }
        });

        // Extract "Skills"
        let skills = [];
        $("h3, h2, strong").each((index, element) => {
            const headingText = $(element).text().trim().toLowerCase();

            if (headingText.includes("skills") || headingText.includes("required skills")) {
                let skillsText = $(element).nextUntil("h3, h2, strong").text().trim();
                skills = skillsText.split("\n").map(line => line.trim()).filter(line => line);
            }
        });

        return {
            Description: jobDescription,
            Responsibilities: responsibilities,
            Skills: skills,
            ApplyLink: jobUrl,
        };
    } catch (error) {
        console.error(`Error fetching job details from ${jobUrl}:`, error.message);
        return null;
    }
}


// Run the function
fetchJobs();



// const axios = require("axios");
// const cheerio = require("cheerio");
// const fs = require("fs");
// const ObjectsToCsv = require("objects-to-csv");

// // Function to wait (delay) between requests
// const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// async function fetchJobs(keyword, location) {
//     let url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
//     const linkedinJobs = [];

//     try {
//         const response = await axios.get(url, {
//             headers: { "User-Agent": "Mozilla/5.0" }, // Prevent getting blocked
//         });
//         if (response.status !== 200) {
//             console.error(`Failed to fetch job details from ${jobUrl}. Status: ${response.status}`);
//             return null;
//         }

//         const html = response.data;
//         const $ = cheerio.load(html);

//         const today = new Date();
//         const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

//         $("li").each((index, element) => {
//             const jobTitle = $(element).find("h3.base-search-card__title").text().trim();
//             const company = $(element).find("h4.base-search-card__subtitle").text().trim();
//             const jobLocation = $(element).find("span.job-search-card__location").text().trim();
//             const link = $(element).find("a.base-card__full-link").attr("href");
//             const postedDate = $(element).find("time").text().trim();
//             const dateTimeAttr = $(element).find("time").attr("datetime");

//             if (jobTitle && company && link && dateTimeAttr) {
//                 const jobDate = new Date(dateTimeAttr);
//                 const timeDifference = today - jobDate;

//                 if (timeDifference <= THIRTY_DAYS_MS && jobLocation.toLowerCase().includes(location.toLowerCase())) {
//                     linkedinJobs.push({
//                         id: linkedinJobs.length + 1,
//                         Title: jobTitle,
//                         Company: company,
//                         Location: jobLocation,
//                         Link: link,
//                         Posted: postedDate,
//                         DateTime: dateTimeAttr,
//                         Details: null,
//                     });
//                 }
//             }
//         });

//         console.log(`Scraping complete. ${linkedinJobs.length} jobs found for '${keyword}' in '${location}'.`);

//         if (linkedinJobs.length > 0) {
//             for (let job of linkedinJobs) {
//                 await sleep(1000); // Add a delay to prevent 429 error
//                 job.Details = await fetchJobDetails(job.Link);
//             }

//             const csv = new ObjectsToCsv(linkedinJobs);
//             await csv.toDisk("./LinkedInJobs.csv");
//             fs.writeFileSync("./LinkedInJobs.json", JSON.stringify(linkedinJobs, null, 2));
//              // Save as JSON
//             fs.writeFileSync("./linkedInJobsWithDetails.json", JSON.stringify(linkedinJobs, null, 2));
//             console.log("JSON file with job details saved successfully.");

//             console.log("CSV and JSON files saved successfully.");
//         } else {
//             console.log("No jobs found matching the criteria.");
//         }
//     } catch (error) {
//         console.error("Error fetching job listings:", error.message);
//     }
// }

// // Function to extract job details with a delay
// async function fetchJobDetails(jobUrl) {
//     try {
//         await sleep(2000); 
//         const response = await axios.get(jobUrl, {
//             headers: { "User-Agent": "Mozilla/5.0" },
//         });

//         if (response.status !== 200) {
//             console.error(`Failed to fetch job details from ${jobUrl}. Status: ${response.status}`);
//             return null;
//         }

//         const html = response.data;
//         const $ = cheerio.load(html);

//         const jobDescription = $("div.show-more-less-html__markup").text().trim();
//         let responsibilities = [], skills = [], aboutCompany = "";

//         $("h3, h2, strong").each((index, element) => {
//             const headingText = $(element).text().trim().toLowerCase();

//             if (headingText.includes("responsibilities")) {
//                 responsibilities = $(element).nextUntil("h3, h2, strong").text().trim().split("\n").map(line => line.trim()).filter(line => line);
//             } else if (headingText.includes("skills")) {
//                 skills = $(element).nextUntil("h3, h2, strong").text().trim().split("\n").map(line => line.trim()).filter(line => line);
//             } else if (headingText.includes("about us")) {
//                 aboutCompany = $(element).nextUntil("h3, h2, strong").text().trim();
//             }
//         });

//         return { Description: jobDescription, Responsibilities: responsibilities, Skills: skills, CompanyInfo: aboutCompany, ApplyLink: jobUrl };
//     } catch (error) {
//         console.error(`Error fetching job details from ${jobUrl}:`, error.message);
//         return null;
//     }
// }

// // Run the function dynamically for multiple keywords & locations
// const jobs = ["React JS", "Angular JS", "Vue JS", "Next JS", "JavaScript Developer"];
// const locations = ["Mumbai", "Pune", "Remote"];

// (async () => {
//     for (const location of locations) { // Iterate through locations first
//         for (const keyword of jobs) { // Then iterate through jobs
//             console.log(`Fetching jobs for '${keyword}' in '${location}'...`);
//             await fetchJobs(keyword, location);
//             await sleep(3000); // Delay between different searches
//         }
//     }
// })();

