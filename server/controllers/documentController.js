import db from "../models/database.js";

const Document = db.Document;

export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { userId: req.user.id },
      order: [["updatedAt", "DESC"]],
    });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { id, title, content = "", tags = [] } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const documentData = {
      title: title.trim(),
      content,
      tags,
      userId: req.user.id,
    };

    if (id) {
      documentData.id = id;
    }

    const document = await Document.create(documentData);
    res.status(201).json(document);
  } catch (error) {
    console.error("Error creating document:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      const { id } = req.body;
      if (id) {
        try {
          const existingDocument = await Document.findOne({
            where: { id, userId: req.user.id },
          });

          if (existingDocument) {
            console.log(
              `Document with ID ${id} already exists, returning existing document`
            );
            return res.status(200).json(existingDocument);
          }
        } catch (fetchError) {
          console.error("Error fetching existing document:", fetchError);
        }
      }

      return res.status(409).json({
        error: "Document with this ID already exists",
        message: "A document with this ID already exists for this user",
      });
    }

    res.status(500).json({ error: "Failed to create document" });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const document = await Document.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;

    await document.update(updateData);

    res.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    await document.destroy();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

export const overwriteDocument = async (req, res) => {
  const { id } = req.user;
  const { id: documentId } = req.params;
  const { title, content = "", tags = [] } = req.body;

  try {
    const existingDocument = await Document.findOne({
      where: { id: documentId, userId: id },
    });

    if (!existingDocument) {
      return res.status(404).json({
        message: "Document not found or you don't have permission to access it",
      });
    }

    existingDocument.title = title.trim();
    existingDocument.content = content;
    existingDocument.tags = tags;
    existingDocument.updatedAt = new Date();

    await existingDocument.save();

    return res.status(200).json(existingDocument);
  } catch (error) {
    console.error("Error overwriting document:", error);
    console.error("Error details:", error.message);

    return res.status(500).json({
      message: "There was an error trying to overwrite the document",
      details: error.message,
    });
  }
};
