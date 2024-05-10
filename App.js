const dotenv=require('dotenv')
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const CVE = require('./model/userSchema'); // Import your Mongoose model

const app = express();
app.use(cors(
  {
    origin: 'http://localhost:3000'
  }
));
dotenv.config({path: './config.env'});
require('./db/conn');

app.use(express.json());

const getCVEData = async () => {
    try {
      const response = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0');
      const cveData = response.data; // Assuming the response contains an array of CVE objects
      return cveData;
    } catch (error) {
      console.error('Error fetching CVE data:', error);
      return null;
    }
  };

  

const saveCVEDataToDatabase = async () => {
  const cveData = await getCVEData();
   if (!cveData || !cveData.vulnerabilities) return;
   try {
    // Iterate through each CVE object in cveData
    for (const cve of cveData.vulnerabilities) {
        // Create a new instance of the CVE model
        const newVulnerability = new CVE({
            id: cve.cve.id,
            sourceIdentifier: cve.cve.sourceIdentifier,
            published: cve.cve.published,
            lastModified: cve.cve.lastModified,
            vulnStatus: cve.cve.vulnStatus,
            descriptions: cve.cve.descriptions,
            metrics: {
                cvssMetricV2: cve.cve.metrics.cvssMetricV2
            },
            weaknesses: cve.cve.weaknesses,
            configurations: cve.cve.configurations,
            references: cve.cve.references
        });
        
        // Save the new Vulnerability instance to the database
        await newVulnerability.save();
        console.log(newVulnerability);
    }
    console.log('CVE data saved to database successfully');
} catch (error) {
    console.error('Error saving CVE data to database:', error);
}
};

const fetchCVEData = async (perPage) => {
  try {
    // Use the find method to fetch CVE documents from the database with pagination
    const cveData = await CVE.find().limit(perPage); // Limit the number of documents returned

    // Return the fetched CVE data
    return cveData;
  } catch (error) {
    // Handle any errors that occur during the fetch process
    console.error('Error fetching CVE data:', error);
    throw error;
  }
};

// Example route handler to fetch CVE data with pagination
app.get('/cves/list', async (req, res) => {
  const { perPage, page } = req.query;
  const pageNumber = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;
  try {
    const totalCount = await CVE.countDocuments();
    const cves = await CVE.find()
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage);
    res.json({
      cveData: cves,
      totalCount
    });
  } catch (error) {
    console.error('Error fetching CVEs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/cves/filter', async (req, res) => {
  try {
    // Extract filter parameters from the request query
    const { cveId, year, score, days } = req.query;
    console.log(cveId);
    // Construct the filter object based on the provided parameters
    const filter = {};
    if (cveId) {
      filter.id = cveId;
    }
    if (year) {
      filter.published = { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) };
    }
    if (score) {
      filter['metrics.cvssMetricV2.cvssData.baseScore'] = score;
    }
    if (days) {
      const lastModifiedThreshold = new Date();
      lastModifiedThreshold.setDate(lastModifiedThreshold.getDate() - days);
      filter.lastModified = { $gte: lastModifiedThreshold };
    }

    // Fetch CVE details based on the filter
    const filteredCVEs = await CVE.find(filter);
    console.log(filteredCVEs)
    // Send the filtered CVE details as response
    res.json(filteredCVEs);
  } catch (error) {
    console.error('Error filtering CVEs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Example route handler to fetch details of a specific CVE
app.get('/cves/:cveId', async (req, res) => {
  try {
    const { cveId } = req.params;
    const cveDetails = await CVE.findOne({ id: cveId });

    if (!cveDetails) {
      return res.status(404).json({ error: 'CVE not found' });
    }

    res.json(cveDetails);
  } catch (error) {
    console.error('Error fetching CVE details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const PORT = 4000;
app.listen(PORT, async() => {
  console.log(`Server is running on port ${PORT}`);
//   await saveCVEDataToDatabase();
});
