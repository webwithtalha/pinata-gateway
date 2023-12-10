const axios = require("axios");

async function uploadJsonToIPFS(jsonData) {
  const options = {
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
    },
  };

  try {
    const response = await axios.post(
      process.env.PINATA_POST_URL,
      jsonData,
      options
    );

    return {
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to upload JSON data to IPFS");
  }
}

exports.jsonUpload = async (req, res) => {
  try {
    const jsonData = req.body;

    const uploadedJson = await uploadJsonToIPFS(jsonData);

    res.json({
      message: "JSON data uploaded successfully",
      ipfsHash: uploadedJson.ipfsHash,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading JSON data",
      error: error.message,
    });
  }
};
