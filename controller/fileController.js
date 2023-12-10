const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const localStoragePath = path.join(__dirname, "local-storage");

// Ensure the local-storage directory exists
fs.mkdir(localStoragePath, { recursive: true });

// Memory cache to store processed CIDs
const cidCache = new Map();

exports.arrayOfCIDS = async (req, res) => {
  try {
    // Accept either a single CID or an array of CIDs
    const cids = Array.isArray(req.body) ? req.body : [req.body];

    // Check if the same array of CIDs has been processed before
    if (cidCache.has(JSON.stringify(cids))) {
      const cachedResult = cidCache.get(JSON.stringify(cids));
      res.json({
        message: "Files fetched from cache",
        files: cachedResult,
      });
      return;
    }

    // Fetch files from IPFS based on CIDs
    const fetchedFiles = await fetchFilesFromIPFS(cids);

    // Check and remove duplicates
    const uniqueFiles = checkAndRemoveDuplicates(fetchedFiles);

    // Cache the result for future use
    cidCache.set(JSON.stringify(cids), uniqueFiles);

    res.json({
      message: "Files processed successfully",
      files: fetchedFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error processing files",
      error: error.message,
    });
  }
};

// Reza brother i am adding this function because while doing this part i try to send to many
// requests and then i am facing 429 error which is too many request
// so i am adding this function to wait for 1 sec before sending another request

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFilesFromIPFS(cids) {
  const fetchedFiles = await Promise.all(
    cids.map(async (cid) => {
      try {
        // Fetch JSON content from IPFS
        const fileContent = await axios.get(
          `${process.env.PINATA_GET_URL}/${cid}`
        );

        // Write JSON content to a local file
        const fileName = `${cid}.json`;
        const filePath = path.join(localStoragePath, fileName);
        await fs.writeFile(filePath, JSON.stringify(fileContent.data, null, 2));

        return {
          cid: cid,
          filePath: filePath,
        };
        await sleep(1000);
      } catch (fetchError) {
        console.error(
          `Error fetching file for CID ${cid}:`,
          fetchError.message
        );
      }
    })
  );

  return fetchedFiles;
}

async function checkAndRemoveDuplicates(files) {
  const uniqueFiles = [];

  // Map to store field "name" values and check for duplicates
  const nameMap = new Map();

  for (const file of files) {
    const content = JSON.parse(await fs.readFile(file.filePath, "utf-8"));
    const name = content.name;

    if (!nameMap.has(name)) {
      nameMap.set(name, true);
      uniqueFiles.push(file);
    } else {
      // Duplicate found, delete the file
      try {
        await fs.unlink(file.filePath);
        // showing here which file is deleted
        console.log(`Duplicate file removed: ${file.filePath}`);
      } catch (err) {
        console.error(`Error removing duplicate file: ${file.filePath}`, err);
      }
    }
  }

  return uniqueFiles;
}
