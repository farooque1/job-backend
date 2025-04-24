const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function fetchJobDetails(jobUrl) {
    let url = jobUrl;
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
            const jobAbout = $(element).find("h3.base-search-card__title").text().trim();
            const company = $(element).find("h4.base-search-card__subtitle").text().trim();
            const location = $(element).find("span.job-search-card__location").text().trim();
            const link = $(element).find("a.base-card__full-link").attr("href");
            const postedDate = $(element).find("time").text().trim(); // e.g., "7 hours ago"
            const dateTimeAttr = $(element).find("time").attr("datetime"); // e.g., "2025-03-06"

            if (jobTitle && company && link && dateTimeAttr && jobAbout) {
                const jobDate = new Date(dateTimeAttr);
                const timeDifference = today - jobDate;
                if (timeDifference <= THIRTY_DAYS_MS) {
                    linkedinJobs.push({
                        id:linkedinJobs.length +1,
                        Title: jobTitle,
                        About: jobAbout,
                        Company: company,
                        Location: location,
                        Link: link,
                        Posted: postedDate,
                        DateTime: dateTimeAttr,
                    });
                }
            }
        });

        console.log(`Scraping complete. ${linkedinJobs.length} jobs found within the last 30 days.`);

        if (linkedinJobs.length > 0) {
        
            // Save as JSON
            fs.writeFileSync("./linkedInJobsDetails.json", JSON.stringify(linkedinJobs, null, 2));
            console.log("JSON file saved successfully.");
        } else {
            console.log("No jobs found in the last 30 days.");
        }
    } catch (error) {
        console.error("Error fetching job listings:", error.message);
    }
}

fetchJobDetails();
