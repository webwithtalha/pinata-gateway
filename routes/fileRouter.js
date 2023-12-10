const express = require("express");
const uploadJsonController = require("../controller/uploadJsonController");
const fileController = require("../controller/fileController");

const router = express.Router();

router.post("/upload", uploadJsonController.jsonUpload);
router.get("/processCIDs", fileController.arrayOfCIDS);

module.exports = router;
