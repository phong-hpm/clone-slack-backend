import * as fileServices from "../services/file.service.js";

export const uploadFiles = async (req, res) => {
  if (!req.files.file) return res.send([]);

  let files = [];

  if (req.files.file.name) {
    // single file
    files = [req.files.file];
  } else {
    // multiple files
    files = req.files.file;
  }

  const { error, data } = await fileServices.uploadFiles(files);

  if (error) res.status(400).send(error);

  res.send(data);
};
