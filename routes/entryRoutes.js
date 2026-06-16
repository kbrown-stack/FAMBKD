const express = require("express");
const router = express.Router();
const {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  deletePhoto,
} = require("../controllers/entryController");
const { protect, checkPartner } = require("../middleware/auth");
const upload = require("../middleware/upload");

// To protect all routes below this line with the API entries as seen below;

router.use(protect);
// /api/entries
router.route('/').get(getEntries).post(upload.array('photos', 4), createEntry);

// /api/entries/:id
router
  .route("/:id")
  .get(checkPartner, getEntry)
  .put(upload.array('4'), updateEntry)
  .delete(deleteEntry);

// /api/entries/:id/photos/:photoId

router.delete('/:id/photos/:photoId', deletePhoto);

module.exports = router;
